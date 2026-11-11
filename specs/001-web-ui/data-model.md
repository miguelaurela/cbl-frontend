# Modelo de datos (Fase 1): interfaz web

**Rama**: `001-web-ui` | **Fecha**: 2026-11-11 | **Plan**: [plan.md](plan.md) | **Especificación**: [spec.md](spec.md)

El frontend no persiste nada: su "modelo" son los **tipos del contrato** (generados desde
[`contracts/openapi.yaml`](contracts/openapi.yaml)) y la **forma del estado de NgRx**. Nada se guarda en el navegador.

## Tipos del contrato (alias de `core/models`)

| Tipo | Campos | Notas |
|---|---|---|
| `Role` | `'Admin' \| 'Borrower'` | En pantalla: Administrador y Prestamista |
| `LoanStatus` | `'Pending' \| 'Approved' \| 'Rejected'` | En pantalla: Pendiente, Aprobado y Rechazado |
| `LoginRequest` | `email`, `password` | |
| `LoginResponse` | `accessToken`, `tokenType` (`Bearer`), `expiresAt` (ISO UTC), `user` | `user`: `id`, `email`, `fullName`, `role` |
| `Loan` | `id`, `borrowerId`, `borrowerName`, `borrowerEmail`, `amount`, `termMonths`, `status`, `createdAt`, `decidedAt`, `decidedById`, `decidedByName`, `version` | Los campos de decisión son `null` mientras esté Pendiente |
| `CreateLoanRequest` | `amount`, `termMonths` | |
| `DecideLoanRequest` | `version?` | Siempre se envía la versión del préstamo mostrado |
| `LoanLimits` | `minAmount`, `maxAmount` | |
| `User` | `id`, `email`, `fullName`, `role`, `isActive`, `createdAt` | |
| `CreateUserRequest` | `email`, `fullName`, `password`, `role` | |
| `UpdateUserRequest` | `fullName`, `role`, `isActive`, `password?` | |
| `ProblemDetails` | `type?`, `title`, `status`, `detail?`, `traceId?`, `errors?` | `errors`: campo (camelCase) → mensajes |

## Tipo propio de la interfaz

**`AppError`** (resultado de `toAppError`): `kind` (`validation`, `unauthorized`, `forbidden`, `notFound`, `conflict`,
`locked`, `rateLimited`, `unexpected`), `status`, `title`, `message`, `fieldErrors` (`Record<string, string[]>`),
`retryAfterSeconds?` y `traceId?` (solo se rellena para `unexpected`, y solo así se muestra).

## Estado de NgRx

### `auth` (raíz)

| Campo | Tipo | Regla |
|---|---|---|
| `status` | `idle \| loading \| authenticated \| failed` | |
| `token` | `string \| null` | **Solo en memoria**; se borra en `logout` y `sessionExpired` |
| `user` | `{ id, email, fullName, role } \| null` | |
| `expiresAt` | `string \| null` | Instante de caducidad devuelto por el login |
| `error` | `AppError \| null` | Error del último intento de login |
| `notice` | `expired \| unauthorized \| loggedOut \| null` | Aviso que la pantalla de acceso muestra y limpia |

Selectores: `selectToken`, `selectUser`, `selectRole`, `selectIsAuthenticated` (hay token y `expiresAt` en el futuro),
`selectAuthLoading`, `selectAuthError`, `selectAuthNotice`. Acciones: `login`, `loginSuccess`, `loginFailure`, `logout`,
`logoutDone`, `sessionExpired`, `clearNotice`.

### `loans` (perezoso; incluye los límites de monto)

| Campo | Tipo | Regla |
|---|---|---|
| `mine` / `all` | `Loan[]` | Listas del prestamista y del administrador |
| `filter` | `'All' \| LoanStatus` | Por defecto `Pending` en la vista del administrador |
| `loadStatus` | `{ mine, all }` cada uno `idle \| loading \| loaded \| failed` | |
| `loadError` | `AppError \| null` | |
| `submitStatus` / `submitError` | `idle \| submitting \| …` / `AppError \| null` | `submitError.fieldErrors` alimenta el formulario de solicitud |
| `decidingIds` | `string[]` | Préstamos con una decisión en curso (impide el doble envío) |
| `limits` | `LoanLimits \| null` | Límites vigentes; se recargan al abrir el formulario |
| `limitsStatus` / `limitsSaveStatus` / `limitsError` | estados y `AppError \| null` | Lectura y guardado del administrador |

Selectores: `selectMyLoans` (más recientes primero), `selectAllLoansFiltered`, `selectPendingCount`, `selectIsDeciding(id)`,
`selectLoansLoading`, `selectLoansError`, `selectLimits`. Acciones: `loadMine`, `loadAll({ status? })`, `create`,
`decide({ id, decision, version })`, `loadLimits`, `saveLimits` (cada una con sus variantes de éxito y fallo).

### `users` (perezoso)

| Campo | Tipo | Regla |
|---|---|---|
| `items` | `User[]` | |
| `loadStatus` / `loadError` | estado / `AppError \| null` | |
| `saveStatus` / `saveError` | estado / `AppError \| null` | `saveError.fieldErrors` alimenta el diálogo (por ejemplo `email` duplicado) |

Acciones: `loadUsers`, `createUser`, `updateUser` (con éxito y fallo); tras guardar se recarga la lista.

## Reglas de validación (de los requisitos y del backend)

| Campo | Regla | Origen |
|---|---|---|
| Login: correo | Obligatorio y con formato de correo | FR-001 |
| Login: contraseña | Obligatoria | FR-001 |
| Solicitud: monto | Mayor que 0, hasta 2 decimales y dentro de los límites vigentes (`limits`) | FR-011 |
| Solicitud: plazo | Entero de 1 a 60 | FR-011 |
| Usuario: correo | Obligatorio, formato válido, máximo 256; duplicado → error del servidor en el campo | FR-019 |
| Usuario: nombre | Obligatorio, máximo 200 | FR-019 |
| Usuario: contraseña | Obligatoria al crear, opcional al restablecer; 8 a 200 caracteres | FR-019 |
| Usuario: rol | `Admin` o `Borrower` | FR-019 |
| Usuario: propia fila | No se puede desactivar ni cambiar el rol (controles bloqueados con explicación) | FR-020 |
| Límites: mínimo | Mayor que 0, hasta 2 decimales, máximo 1.000.000.000.000 | FR-022 |
| Límites: máximo | Mayor que el mínimo, hasta 2 decimales, máximo 1.000.000.000.000 | FR-022 |

El servidor repite todas estas reglas y es la autoridad: sus errores `422` se muestran junto al campo.

## Transiciones

**Sesión**

```text
 idle ──login──► loading ──loginSuccess──► authenticated ──(temporizador a expiresAt)──► sessionExpired ─► idle (+aviso)
                    │                            │
                    └──loginFailure──► failed    ├──logout──► (POST /api/auth/logout, falla ignorada) ─► idle (+aviso)
                                                 └──401 en una petición autenticada──► sessionExpired ─► idle (+aviso)
```

**Decisión sobre un préstamo (vista del administrador)**

```text
 Pendiente ──(Aprobar o Rechazar + confirmación)──► decidingIds += id ──► POST con { version }
      ├─ 200 ─► se recarga la lista desde la API (con el filtro) ─► el préstamo muestra el estado, quién y cuándo
      ├─ 409 ─► aviso "ya fue decidida por otra persona" ─► se recarga la lista
      └─ otro error ─► aviso claro; la solicitud queda como estaba
 Aprobado / Rechazado: sin acciones (la decisión es final)
```
