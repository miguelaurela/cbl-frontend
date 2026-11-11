# Conciliación del contrato con el backend (FE-74)

**Fecha**: 2026-11-11 | **Plan**: [../plan.md](../plan.md)

El archivo [`openapi.yaml`](openapi.yaml) de esta carpeta es una **copia** del contrato del backend: `cbl-backend`, archivo
`specs/001-gestion-prestamos/contracts/openapi.yaml`, copiado desde el commit `f92f9d5`. Es la referencia del frontend; los
tipos de TypeScript se generan a partir de ella (ver [research.md](../research.md), R5) y el CI avisa si diverge de la versión
publicada en el backend.

## Los 9 puntos de la lista de conciliación de `docs/planning/tasks-frontend.md`

| # | Punto | Lo que asumía el frontend | Lo que hace el backend | Resultado |
|---|---|---|---|---|
| 1 | Rutas y prefijo `/api`; `mine` frente a filtro | `/api/...`, `GET /api/loans/mine` y `GET /api/loans?status=` | Igual | Coincide |
| 2 | Tipo de id y enumeraciones | Ids GUID como cadena opaca; enumeraciones como cadena | Igual | Coincide |
| 3 | Decisiones con `version` | Cuerpo `{ version }` o vacío; la segunda decisión siempre da 409 | Cuerpo **opcional** `{ version }`; una versión desactualizada o una segunda decisión dan 409 | Coincide; el frontend envía siempre `version` |
| 4 | Código del bloqueo de login | 423 (alternativa 429 con `Retry-After`) | **423** con `Retry-After` (900 s por defecto); el límite de solicitudes da 429 con `Retry-After` | Coincide; ambos casos se tratan |
| 5 | `expiresAt` en `LoginResponse` | Presente | Presente (`accessToken`, `tokenType`, `expiresAt`, `user`) | Coincide |
| 6 | Estado de validación y claves de `errors` | 400 o 422, claves en camelCase | **422** con `errors` por campo en camelCase; 400 solo para JSON mal formado o un `status` inválido | Coincide |
| 7 | Ubicación de los límites | `/api/parameters/loan-limits`, legible por Borrower | Igual; `PUT` solo Admin; `{ minAmount, maxAmount }` | Coincide |
| 8 | Política de contraseña | Mínimo 8 | Mínimo 8 y máximo 200 | Coincide (se añade el máximo) |
| 9 | CORS | Permite el origen del frontend y `Authorization` | Origen configurable (`http://localhost:4200` por defecto); expone `Retry-After` y `X-Correlation-Id` | Coincide |

## Diferencias frente al contrato asumido

| Tema | Asumido | Real | Efecto en el frontend |
|---|---|---|---|
| Cierre de sesión | No existía | `POST /api/auth/logout` (204): revoca el token; después, el token responde 401 en todo | El cierre manual llama a este endpoint y descarta el estado local aunque falle (FR-007). El interceptor de 401 no actúa sobre esta llamada |
| `DELETE /api/users/{id}` | Se listaba como no usado | **No existe**; la baja es `PUT` con `isActive=false` | Sin impacto: la interfaz nunca lo usó |
| `GET /api/users/{id}` y `GET /api/loans/{id}/status` | No estaban | Existen | La interfaz no los usa en esta versión |
| Contraseña al actualizar usuario | Opcional | Opcional; si viene debe cumplir la política | Igual |
| Auto-baja o cambio de rol propio | 403 | **403** | La interfaz además bloquea los controles (FR-020) |
| Nombre completo del usuario | Máximo 100 | Máximo **200** | El validador usa 200 |
| Mensajes de error (`detail`) | Genéricos | En **español** y seguros para mostrar | Se muestran para 403, 404, 409 y 422 sin campo; para el 401 del login se usa siempre el texto propio de la interfaz |
| `traceId` | En `ProblemDetails` | En **todo** error, igual al `X-Correlation-Id` de la respuesta | Se muestra solo en errores inesperados (aclaración) |
| Rutas inexistentes | — | Responden 401 (política de respaldo) | Sin impacto: el frontend solo llama a rutas del contrato |

## Operaciones del contrato que usa la interfaz

| Operación | Rol | Historia | Notas |
|---|---|---|---|
| `POST /api/auth/login` | anónimo | 1 | 401 genérico, 422 por campo, 423 y 429 con `Retry-After` |
| `POST /api/auth/logout` | autenticado | 2 | 204; falla en silencio |
| `GET /api/parameters/loan-limits` | cualquiera autenticado | 3, 9 | Para validar el monto y mostrar la ayuda |
| `POST /api/loans` | Borrower | 3 | 422 con `errors.amount` o `errors.termMonths` |
| `GET /api/loans/mine` | Borrower | 4 | Más recientes primero |
| `GET /api/loans?status=` | Admin | 5 | Sin paginación; filtro opcional |
| `POST /api/loans/{id}/approve` y `/reject` | Admin | 6 | Cuerpo `{ version }`; 409 si ya está decidido |
| `GET/POST /api/users`, `PUT /api/users/{id}` | Admin | 8 | 409 con `errors.email` al duplicar; 403 en la auto-baja |
| `PUT /api/parameters/loan-limits` | Admin | 9 | 422 con `errors.minAmount` o `errors.maxAmount` |

**No usadas por la interfaz** (la API las soporta): `GET /api/loans/{id}`, `GET /api/loans/{id}/status`,
`PUT /api/loans/{id}`, `DELETE /api/loans/{id}` y `GET /api/users/{id}`.
