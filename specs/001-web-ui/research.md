# Investigación (Fase 0): interfaz web

**Rama**: `001-web-ui` | **Fecha**: 2026-11-11 | **Plan**: [plan.md](plan.md)

Todas las incógnitas del contexto técnico quedan resueltas aquí. Las decisiones ya registradas como ADR (0012, 0013, 0020,
0025) y en la constitución se citan y no se reabren.

## R1. Plataforma, versiones y herramientas

- **Decisión**: Angular **19.2.x** (core 19.2.25), TypeScript 5.8, RxJS 7.8, zone.js 0.15; Angular Material y CDK **19.2.19**;
  NgRx (`store`, `effects`, `store-devtools`) **19.2.1**; angular-eslint 19.8; Karma 6.4 con Jasmine 5. Componentes
  standalone, SCSS, sin SSR, con zone.js (el modo sin zonas sigue siendo experimental en la 19). Gestor de paquetes npm con
  `package-lock.json` versionado y `npm ci` en CI.
- **Node**: Angular 19.2 admite `^18.19.1 || ^20.11.1 || >=22`. Esta máquina tiene Node 18.20.8 (activo) y 20.19.0 (nvm). Se
  fija `engines.node >= 18.19.1`, el CI y `.nvmrc` usan **Node 22 LTS** (tarea D1.3 del plan de DevOps) y en local sirve
  cualquiera de los dos instalados; si una herramienta exigiera más, se usa `nvm use 20.19.0`.
- **TypeScript estricto**: `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` y `strictTemplates`.
- **Razón**: ADR-0001/0012 y constitución (I, II). Las versiones 19.2.x son la última línea estable de la 19 y encajan entre
  sí (peer dependencies comprobadas: NgRx 19 → Angular `^19`; Material 19.2 → CDK 19.2).
- **Alternativas**: Angular 20 (descartada: la constitución y el enunciado fijan la 19); Jest o Vitest (descartadas: Karma es
  el valor por defecto de Angular 19 y evita configuración extra; Chrome está instalado en local y en `ubuntu-latest`); modo
  sin zonas (experimental).

## R2. Estructura y reparto de responsabilidades

- **Decisión**: `src/app/{core,features,shared,store}` como pide la constitución (I):
  - `core/` — `api` (servicios HTTP delgados y tipos generados), `auth` (página de login, utilidades de sesión), `config`
    (configuración en tiempo de ejecución), `errors`, `guards`, `i18n` (`labels.ts`), `interceptors`, `mock`, `models`,
    `notifications`.
  - `features/` — `loans` (vista del prestamista) y `admin` (solicitudes, usuarios, límites).
  - `shared/` — componentes de estado, chip de estado, diálogo de confirmación, validadores y ayudantes de formularios.
  - `store/` — `auth`, `loans` y `users` (acciones, reducer, efectos, selectores).
- **La página de login vive en `core/auth`**, no en una carpeta nueva de `features`, para respetar la lista de la constitución
  (`features` = `loans` y `admin`).
- **Los límites de monto viven dentro del slice `loans`** (estado `limits` y sus estados de carga y guardado), no en un cuarto
  slice `parameters` como proponía el borrador del plan de tareas: la constitución (II) enumera exactamente `auth`, `loans` y
  `users`, y los límites solo existen para validar y gestionar préstamos.
- **Razón**: estructura previsible por responsabilidad; menos piezas para una prueba de este tamaño.
- **Alternativas**: carpeta por funcionalidad con su propio estado (descartada por la constitución); slice `parameters`
  (descartada, ver arriba).

## R3. Estado con NgRx

- **Decisión**: slices `auth` (registrado en la raíz, lo necesitan guards e interceptores), `loans` y `users` (registrados
  con `provideState` y `provideEffects` en los `providers` de sus rutas perezosas). Efectos funcionales
  (`createEffect(..., { functional: true })`) con `inject()`. Los componentes leen con `store.selectSignal(selector)` y
  despachan acciones; **solo los efectos llaman a la API**, a través de `core/api`. Las listas son matrices simples
  (volumen pequeño, sin `@ngrx/entity`). `store-devtools` solo en desarrollo y mock.
- **Tras decidir**, el efecto recarga la lista desde la API con el filtro actual (constitución II, SC-003).
- **Razón**: ADR-0012; flujo unidireccional, trazable y probable.
- **Alternativas**: servicios con signals (permitido por el enunciado, pero ADR-0012 ya eligió NgRx); `@ngrx/signals` (más
  moderno, pero fuera del alcance decidido).

## R4. Sesión, seguridad y flujo de cierre

- **Token solo en memoria**: vive en el estado `auth`; nunca en `localStorage`, `sessionStorage`, cookies ni IndexedDB
  (constitución III, ADR-0013). Una prueba y una regla de lint lo vigilan (R12).
- **Caducidad**: tras `loginSuccess`, un efecto arranca un temporizador hasta `expiresAt` (del login; 10 minutos) y despacha
  `sessionExpired`; se cancela con `logout`. `authGuard` también comprueba que `expiresAt` esté en el futuro.
- **Cierre manual**: el efecto llama a `POST /api/auth/logout`, ignora cualquier fallo, limpia el estado y navega a `/login`
  (FR-007). El interceptor de 401 **no actúa** sobre `login` ni sobre `logout`.
- **Aviso en el login**: el estado `auth` guarda un `notice` (`expired`, `unauthorized`, `loggedOut`) que la página de acceso
  muestra y limpia; no se usa almacenamiento.
- **Volver a la pantalla pedida**: `authGuard` redirige a `/login?returnUrl=<ruta>`; tras el login se navega a `returnUrl` si es
  una ruta interna válida (empieza por `/`, no por `//`, sin esquema ni `\`) y los guards del rol la permiten; si no, a la
  vista propia del rol (aclaración 2). Se valida para evitar redirecciones abiertas.
- **Bearer solo a la API**: el interceptor añade `Authorization` únicamente a URLs que empiezan por `API_BASE_URL` y solo si
  hay token (ADR-0020).
- **XSS (FR-027)**: se usa solo interpolación de plantillas (sanea por defecto), de modo que el texto del servidor se muestra
  siempre como texto; se prohíben `innerHTML` y `bypassSecurityTrust*`.
- **Razón**: constitución III; ADR-0013 y ADR-0020; FR-005 a FR-010 y SC-004, SC-008.
- **Alternativas**: refresh token en cookie `HttpOnly` (evolución futura, ADR-0013); renovar la sesión con un aviso previo
  (descartado por la aclaración 4: sin aviso previo ni renovación).

## R5. Contrato con el backend y tipos

- **Decisión**: la copia del OpenAPI del backend está en `specs/001-web-ui/contracts/openapi.yaml`
  ([conciliación](contracts/reconciliation.md)). Los **tipos se generan** con `openapi-typescript` 7 en
  `src/app/core/api/openapi.generated.ts` (archivo versionado). `core/models` reexporta alias legibles (`Loan`, `User`,
  `LoanLimits`, `Role`, `LoanStatus`, `ProblemDetails`, …). Scripts: `contract:generate` (regenera) y `contract:check` (regenera
  y falla si hay diferencias). Un tercer script avisa, sin bloquear, si la copia difiere de la publicada en `cbl-backend`
  (`contract:sync`, descarga el archivo `main` del backend).
- **Servicios**: `AuthApi`, `LoansApi`, `UsersApi` y `ParametersApi` (los límites; su estado vive en el slice `loans`) como
  envoltorios delgados de `HttpClient`, con una sola función por operación y tipos del contrato; sin `any`. `API_BASE_URL`
  es un token de inyección.
- **Aprobar y rechazar** envían `{ version }` con la versión del préstamo que ve la pantalla, así una decisión sobre datos
  desactualizados recibe 409 (R7 de la conciliación).
- **Razón**: constitución (Restricciones de entrega: "la copia se concilia con la del backend"); la generación elimina la
  deriva manual entre modelos y contrato y el CI la hace visible.
- **Alternativas**: modelos escritos a mano (descartada: se desincronizan sin que nadie lo note); generador de clientes
  completo (`openapi-generator`, descartada: demasiado código generado para 14 operaciones).

## R6. Errores de la API

- **Decisión**: `toAppError(httpError)` produce `{ kind, status, title, message, fieldErrors, retryAfterSeconds?, traceId? }`
  con estas reglas (constitución IV):
  - 422 y 400 → `fieldErrors` (claves en camelCase) o, si no hay campo, `message` con el `detail`.
  - 401 de `login` → texto propio "Correo o contraseña incorrectos" (nunca el del servidor).
  - 403, 404 y 409 → `message` con el `detail` del servidor (en español y seguro).
  - 423 y 429 → mensaje con el tiempo de espera leído de la cabecera `Retry-After` (el backend la expone por CORS).
  - Red (estado 0), 5xx, cuerpos que no son `ProblemDetails` y cualquier código no clasificado → `kind: 'unexpected'` con
    mensaje genérico y **el `traceId` solo en este caso** (aclaración 1).
- **Razón**: FR-003, FR-004, FR-025; el backend devuelve siempre `application/problem+json` con `traceId`.
- **Alternativas**: mostrar siempre el `detail` (descartada: filtraría texto técnico en los 5xx); mapear por título.

## R7. Formularios y validadores

- **Decisión**: Reactive Forms tipados. Validadores que reflejan al backend (que sigue siendo la autoridad):
  monto > 0, hasta 2 decimales y dentro de los límites vigentes (lee `limits` del store); plazo entero de 1 a 60; usuario:
  correo válido (máx. 256), nombre obligatorio (máx. **200**), contraseña de 8 a 200 (obligatoria al crear, opcional al
  restablecer), rol `Admin` o `Borrower`; límites: mínimo > 0, máximo > mínimo, hasta 2 decimales y tope de
  1.000.000.000.000. `applyServerErrors(form, fieldErrors)` marca un error `server` en el control (y lo limpia al editar);
  `errorMessage(control)` traduce las claves a texto de `labels.ts`.
- **Razón**: constitución IV; FR-011, FR-019, FR-022.
- **Alternativas**: validar solo en el servidor (peor experiencia, incumple la constitución).

## R8. Modo demostración (mock) permanente

- **Decisión**: configuración de build `mock` en `angular.json` con **sustitución de archivos**: el archivo
  `core/mock/mock-api.providers.ts` exporta una lista vacía de interceptores y la configuración `mock` lo sustituye por
  `mock-api.providers.mock.ts`, que exporta el interceptor real. Así los builds `development` y `production` **nunca
  importan** el código del mock (más fuerte que una bandera en tiempo de ejecución). El interceptor del mock va **el
  último** de la cadena, para que el de autenticación y el de errores sigan ejecutándose. `environment.mock.ts` además
  activa `useMockApi` para el aviso "Modo demostración" (FR-030).
- **Fidelidad al backend** (FR-029): base en memoria con los mismos datos semilla (`usuario@test.com`, `admin@test.com`,
  contraseña `123`, límites 1.000–100.000, préstamos en los tres estados); latencia simulada de 300–600 ms (0 en pruebas);
  token con forma de JWT sin firma (`sub`, `email`, `role`, `jti`, `exp` = ahora + 10 min) que el mock valida en cada
  llamada; mismas validaciones y mensajes en español; bloqueo tras 5 fallos por correo (exista o no) durante 15 minutos con
  423 y `Retry-After`; revocación por `logout`; 403 por rol; 409 en la segunda decisión o con versión desactualizada; reglas
  de usuarios (contraseña ≥ 8, correo duplicado con `errors.email`, auto-baja y cambio de rol propio con 403, usuario
  desactivado no inicia sesión); `fail500@test.com` fuerza un 500 en el login para probar el estado de error.
- **Cobertura del contrato**: un script (`contract:check-mock`) compara las rutas registradas en el mock con las operaciones
  de `openapi.yaml` y falla si falta alguna.
- **Razón**: constitución V; ADR-0025; historia 7 (FR-028, FR-029 y FR-030; SC-010: todas las historias P1 se pueden recorrer
  sin backend).
- **Alternativas**: `json-server` (descartada por ADR-0025: no expresa 409, bloqueo ni expiración); una bandera
  `useMockApi` sola (el código del mock quedaría en el bundle de producción); MSW (más piezas para el mismo resultado).

## R9. Interfaz: Material, diseño y accesibilidad

- **Decisión**: Angular Material 19 con tema Material 3 claro (un primario y un terciario), Roboto e iconos de Material. Tablas
  `mat-table` desde 768 px y tarjetas apiladas por debajo (FR-015, FR-026); filtro con `mat-button-toggle`; diálogos
  `MatDialog` (confirmación y formulario de usuario); avisos con `MatSnackBar` (4 s, `aria-live` educado). Todas las
  etiquetas salen de `core/i18n/labels.ts`. Formato: importes con `CurrencyPipe` (`currencyCode` y `locale` de `environment`,
  `USD` y `en-US`); fechas con `DatePipe` y el formato `dd/MM/yyyy HH:mm` en la zona horaria del navegador (aclaración 4).
- **Accesibilidad** (FE-70): etiqueta visible en cada campo, foco visible, `role="status"` en los estados de carga y vacío,
  `aria-live` en los avisos, diálogos con gestión de foco de Material y teclado operable; los estados se muestran con icono y
  texto, no solo con color. Revisión a 360, 768 y 1280 px y objetivo de puntuación de accesibilidad ≥ 90 en el login y la
  lista de préstamos.
- **Razón**: constitución IV; ADR-0025; FR-014, FR-024, FR-026.
- **Alternativas**: otra librería de UI (descartada por la constitución); biblioteca de i18n (descartada por ADR-0025).

## R10. Rutas y navegación

- **Decisión**: rutas perezosas (`loadComponent`): `/login` (con `guestGuard`), `/loans` (`authGuard` + `borrowerGuard`),
  `/admin/loans`, `/admin/users`, `/admin/limits` (`authGuard` + `adminGuard`), `/forbidden` y `**` → `/login`. Un rol no
  permitido se redirige a su vista propia con un aviso. La barra superior muestra la navegación según el rol (Prestamista:
  "Mis préstamos"; Administrador: "Solicitudes", "Usuarios", "Límites"), el correo y el rol, y "Cerrar sesión".
- **Razón**: FR-009, FR-010; ADR-0020.

## R11. Pruebas

- **Decisión**: Karma + Jasmine con `ChromeHeadless` (lanzador propio con `--no-sandbox` para CI). Pruebas unitarias de
  reducers, selectores, efectos (`provideMockActions`, `fakeAsync` para el temporizador), guards, interceptores
  (`HttpTestingController`), validadores y utilidades (`toAppError`, `applyServerErrors`, saneado de `returnUrl`), del
  interceptor del mock (sus reglas) y humo de componentes (Login, vista del prestamista y lista del admin con `MockStore`).
  Una prueba verifica que el token no se escribe en `localStorage` ni en `sessionStorage`. Sin pruebas de extremo a extremo
  automáticas (alcance de la prueba); la verificación de extremo a extremo se hace a mano en modo mock siguiendo el
  quickstart.
- **Razón**: constitución VI; FE-60 a FE-66.
- **Alternativas**: Playwright o Cypress (más infraestructura; el mock permite la comprobación manual); Jest (configuración
  extra).

## R12. Lint, endurecimiento y calidad

- **Decisión**: angular-eslint 19 (configuración plana `eslint.config.js`) con reglas que **prohíben** `localStorage`,
  `sessionStorage`, `innerHTML` y `bypassSecurityTrust*` en `src/`. Un paso de CI repite la comprobación con `grep` (FE-72)
  y verifica que el build de producción no contiene cadenas exclusivas del mock. EditorConfig para el formato.
- **Razón**: constitución III y VI.

## R13. Configuración en tiempo de ejecución

- **Decisión**: `public/config.json` con `{ "apiBaseUrl": "..." }` que se lee antes de arrancar la aplicación y sustituye el
  valor por defecto de `environment`. Así el **mismo artefacto de producción** sirve para cualquier URL de API sin
  recompilar (el CD solo publica artefactos). En la configuración `mock` no se descarga. Valores por defecto: API en
  `http://localhost:5000` (la dirección por defecto del backend en desarrollo), con CORS ya permitido para
  `http://localhost:4200`.
- **Razón**: el artefacto se despliega manualmente en entornos desconocidos (ADR-0024 del backend y constitución).
- **Alternativas**: URL fija en tiempo de compilación (obliga a recompilar por entorno); proxy de desarrollo (no sirve para el
  artefacto publicado).

## R14. CI y entrega

- **Decisión**: `.github/workflows/ci.yml` (en `push` y `pull_request`; Node 22 y `npm ci`): lint, pruebas unitarias con
  Chrome headless, build de producción y build `mock`, `contract:check`, `contract:check-mock`, comprobaciones de
  endurecimiento y subida de `dist/` como artefacto. `.github/workflows/release.yml`: un tag `v*.*.*` reconstruye, ejecuta
  las pruebas y crea un GitHub Release con el zip del build de producción y `SHA256SUMS.txt`, solo con `GITHUB_TOKEN`. **Sin
  despliegue en ningún entorno.**
- **Razón**: constitución (Restricciones de entrega); mismo patrón que el backend.

## R15. Documentación y ADR

- **Decisión**: README en inglés y español (ejecutar con mock y contra la API real, configuración, pruebas, estructura,
  comportamiento de la sesión). ADR nuevos desde el **0027** (el 0026 es del backend): mock por sustitución de archivos
  (0027), cierre y caducidad de sesión con `logout` en el servidor y `returnUrl` (0028), tipos generados desde el OpenAPI
  (0029) y configuración en tiempo de ejecución (0030). Bitácora de Spec Kit al día.

## Resultado

No quedan incógnitas. Pasar a la Fase 1: [data-model.md](data-model.md), [contracts/](contracts/) y
[quickstart.md](quickstart.md).
