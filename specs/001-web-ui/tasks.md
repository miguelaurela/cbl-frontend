---

description: "Lista de tareas de implementación: CBL Project – Interfaz web (frontend)"
---

# Tareas: CBL Project – Interfaz web (frontend)

**Entrada**: documentos de diseño en `specs/001-web-ui/`

**Requisitos previos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/openapi.yaml](contracts/openapi.yaml), [contracts/reconciliation.md](contracts/reconciliation.md), [quickstart.md](quickstart.md)

**Pruebas**: SE INCLUYEN. La constitución (principio VI) exige pruebas unitarias de reducers, selectores, efectos, guards, interceptores y validadores, y una prueba de que el token no toca el almacenamiento del navegador. Dentro de cada historia, las pruebas se escriben primero y deben fallar antes de implementar.

**Organización**: las tareas se agrupan por historia de usuario del spec para poder implementarlas y probarlas de forma independiente. El modo demostración (`mock`) se construye de forma incremental: la infraestructura en Fundamentos y las rutas de cada historia dentro de su fase, de modo que cada historia se pueda recorrer en el navegador sin backend.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos y sin dependencias pendientes)
- **[USn]**: historia de usuario a la que pertenece (trazabilidad con el spec)
- Cada tarea incluye la ruta exacta del archivo; `(dep: …)` indica las tareas que deben estar hechas antes

## Convenciones de rutas

Una sola aplicación Angular en la raíz del repositorio, según el plan: `src/app/{core,features,shared,store}`, `src/environments/`, `public/`, `scripts/`, `.github/workflows/`. Código e identificadores en inglés; etiquetas de la interfaz en español en `src/app/core/i18n/labels.ts`; documentación en español (y gemelos `.es.md`).

**Comandos de referencia**: `npm test` (Karma + Jasmine, Chrome headless, sin modo watch), `npm run lint`, `npm run build`, `npm run build:mock`, `npm run start:mock`, `npm run contract:check`, `npm run contract:check-mock`.

**Nota sobre las pruebas**: cada tarea de prueba crea el `*.spec.ts` junto al archivo que cubre; las "pruebas de esa historia" se ejecutan con `npm test`.

---

## Fase 1: Preparación (infraestructura compartida)

**Propósito**: crear el proyecto Angular y sus herramientas.

- [x] T001 Verificar las herramientas (Node 18.19.1 o superior, o `nvm use 20.19.0`; npm 10; Chrome) y generar el proyecto con `npx -y -p @angular/cli@19.2 ng new` en un directorio temporal (`--standalone --routing --style=scss --ssr=false --skip-git --skip-install`); comprobar que `@angular/core` queda en 19.2.x; mover `package.json`, `angular.json`, `tsconfig*.json`, `src/` y `public/` a la raíz sin tocar `docs/`, `specs/`, `.specify/`, `.claude/`, `.github/`, `README.md` ni `README.es.md`
- [x] T002 [P] Crear `.nvmrc` con `22`, añadir `engines.node >=18.19.1` a `package.json`, crear `.editorconfig` y completar `.gitignore` con `node_modules/`, `dist/`, `.angular/`, `coverage/` y `.claude/settings.local.json` (dep: T001)
- [x] T003 [P] Activar TypeScript estricto en `tsconfig.json` (`strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`) y `strictTemplates` en `tsconfig.json` (`angularCompilerOptions`) (dep: T001)
- [x] T004 Instalar dependencias en `package.json` y `package-lock.json`: `@angular/material` y `@angular/cdk` 19.2, `@ngrx/store`, `@ngrx/effects` y `@ngrx/store-devtools` 19.2.1, `@fontsource/roboto`, `material-icons`; en desarrollo `openapi-typescript` 7, `js-yaml` y angular-eslint (`ng add @angular-eslint/schematics`) (dep: T001)
- [x] T005 Crear `src/environments/environment.ts`, `environment.mock.ts` (`useMockApi: true`) y `environment.prod.ts` con `apiBaseUrl` (`http://localhost:5000`), `useMockApi`, `currencyCode` (`USD`) y `locale` (`en-US`); crear los archivos `src/app/core/mock/mock-api.providers.ts` (exporta una lista vacía de interceptores) y `src/app/core/mock/mock-api.providers.mock.ts` (marcador por ahora); en `angular.json` definir las configuraciones `development`, `mock` (sustituye `environment.ts` por `environment.mock.ts` y `mock-api.providers.ts` por `mock-api.providers.mock.ts`) y `production`; y los scripts npm `start`, `start:mock`, `build`, `build:mock` y `lint` en `package.json` (dep: T004)
- [x] T006 [P] Crear `karma.conf.js` con el lanzador `ChromeHeadlessCI` (`--no-sandbox`) y el script `test` de `package.json` (`ng test --watch=false --browsers=ChromeHeadlessCI`) (dep: T004)
- [x] T007 [P] Crear `eslint.config.js` con reglas que prohíben `localStorage`, `sessionStorage`, `innerHTML` y `bypassSecurityTrust*` en `src/` (constitución, principio III) (dep: T004)
- [x] T008 [P] Crear el tema Material 3 claro en `src/styles.scss` (un primario y un terciario, tokens de espacio y ancho máximo del contenedor) y cargar Roboto y los iconos de forma local desde `src/styles.scss` (sin CDN) (dep: T004)

---

## Fase 2: Fundamentos (prerrequisitos bloqueantes)

**Propósito**: contrato, configuración, errores, servicios HTTP, componentes compartidos, mock base y esqueleto de la aplicación que DEBEN estar listos antes de cualquier historia.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta completar esta fase.

**Requisitos transversales que cubre**: FR-024 (etiquetas en español, importes y fechas: T013), FR-025 (mapeo de errores: T014, T018), FR-026 (estados de carga, error y vacío, y teclado: T017, T021) y FR-027 (texto del servidor siempre como texto: T007 y T090).

- [x] T009 Añadir los scripts `contract:generate` y `contract:check` a `package.json` (`openapi-typescript specs/001-web-ui/contracts/openapi.yaml -o src/app/core/api/openapi.generated.ts`; el segundo regenera y falla si `git diff` detecta cambios) y generar y versionar `src/app/core/api/openapi.generated.ts` (dep: T004)
- [x] T010 Crear `src/app/core/models/index.ts` con los alias legibles de los tipos generados (`Role`, `LoanStatus`, `Loan`, `User`, `LoginRequest`, `LoginResponse`, `CreateLoanRequest`, `DecideLoanRequest`, `LoanLimits`, `CreateUserRequest`, `UpdateUserRequest`, `ProblemDetails`), sin `any` (dep: T009)
- [x] T011 [P] Crear `scripts/check-contract-sync.mjs` y el script `contract:sync` de `package.json`: descarga `specs/001-gestion-prestamos/contracts/openapi.yaml` de la rama `main` de `cbl-backend` y avisa, sin fallar, si difiere de `specs/001-web-ui/contracts/openapi.yaml` (dep: T004)
- [x] T012 Crear `src/app/core/api/api-base-url.token.ts` (`API_BASE_URL`), `src/app/core/config/runtime-config.ts` (lee `config.json` antes de arrancar y sustituye `apiBaseUrl`; en el modo `mock` no se descarga) y `public/config.json` con `{ "apiBaseUrl": "http://localhost:5000" }` (dep: T005)
- [x] T013 [P] Crear `src/app/core/i18n/labels.ts` con el objeto único de etiquetas en español (roles Prestamista y Administrador, estados Pendiente, Aprobado y Rechazado, botones comunes, mensajes de carga, vacío y error); cada historia añade las suyas (dep: T001)
- [x] T014 [P] Crear `src/app/core/errors/app-error.ts` (`AppError` con `kind`, `status`, `title`, `message`, `fieldErrors`, `retryAfterSeconds?`, `traceId?`) y `src/app/core/errors/to-app-error.ts`: 422 y 400 a `fieldErrors` en camelCase o a `message`; 401 de login con el texto propio; 403, 404 y 409 con el `detail` del servidor; 423 y 429 con `Retry-After`; red, 5xx y cuerpos no `ProblemDetails` como `unexpected`, el único caso que conserva el `traceId`; con `src/app/core/errors/to-app-error.spec.ts` (400 y 422 con `errors`, 401, 403, 404, 409, 423 y 429 con y sin cabecera, 500, estado 0, cuerpo que no es ProblemDetails) (dep: T010, T013)
- [x] T015 [P] Crear los servicios HTTP delgados `src/app/core/api/auth.api.ts` (`login`, `logout`), `loans.api.ts` (`listMine`, `listAll(status?)`, `create`, `approve(id, version)`, `reject(id, version)`), `users.api.ts` (`list`, `create`, `update`) y `parameters.api.ts` (`getLoanLimits`, `updateLoanLimits`), una función por operación del contrato y con los tipos de `core/models`, más `src/app/core/api/*.api.spec.ts` con `HttpTestingController` (URL, método y cuerpo; `approve` envía `{ version }`) (dep: T010, T012)
- [x] T016 [P] Crear `src/app/core/notifications/notification.service.ts` (envoltorio de `MatSnackBar`: éxito, error e información, 4 s, `aria-live` educado) y `src/app/core/notifications/notification.service.spec.ts` (dep: T008)
- [x] T017 [P] Crear los componentes compartidos `src/app/shared/components/state-view/state-view.component.ts` (entradas `loading`, `error`, `empty`, `emptyMessage`; salida `retry`; `role="status"`), `status-chip/status-chip.component.ts` (Pendiente, Aprobado y Rechazado con color, icono y texto) y `confirm-dialog/confirm-dialog.component.ts` (`MatDialog`, operable con teclado), cada uno con su `*.spec.ts` (dep: T008, T013)
- [x] T018 [P] Crear los ayudantes de formularios `src/app/shared/forms/apply-server-errors.ts` (marca un error `server` en el control y lo limpia al editar) y `src/app/shared/forms/error-message.ts` (traduce las claves de error a texto de `labels.ts`) con sus `*.spec.ts` (el error del servidor `amount` aparece en el control y desaparece al editar) (dep: T013, T014)
- [x] T019 Crear la infraestructura del mock en `src/app/core/mock/`: `mock-api.interceptor.ts` (incluye el marcador `__CBL_MOCK_API__`; interceptor funcional con una tabla de rutas `route('METHOD', '/api/...', handler)`, latencia de 300–600 ms configurable a 0 en pruebas, respuestas `application/problem+json` con `traceId`), `mock-db.ts` (base en memoria con los datos semilla: `usuario@test.com` y `admin@test.com`, contraseña `123`, límites 1.000–100.000), `mock-token.ts` (token con forma de JWT sin firma con `sub`, `email`, `role`, `jti` y `exp` = ahora + 10 min) y un reloj inyectable para las pruebas; reemplazar el marcador de `mock-api.providers.mock.ts` para exportar el interceptor; con `src/app/core/mock/mock-api.interceptor.spec.ts` (esqueleto: ruta desconocida, latencia 0) (dep: T005, T014)
- [x] T020 Crear `src/app/app.config.ts` con `provideZoneChangeDetection`, `provideRouter`, `provideAnimationsAsync`, `provideHttpClient(withInterceptors([...]))` con la lista de `mock-api.providers` (vacía fuera del modo mock; los interceptores propios los añade T039 antes del mock), `provideStore`, `provideEffects`, `provideStoreDevtools` solo en desarrollo y mock, el inicializador de la configuración en tiempo de ejecución y los valores de moneda y regional desde `environment` (dep: T012, T019)
- [x] T021 Crear el esqueleto de la aplicación `src/app/app.component.ts|html|scss` (barra superior con el nombre "CBL", espacio para el usuario, el rol y "Cerrar sesión", `router-outlet`, responsive desde 360 px sin desplazamiento horizontal) con `src/app/app.component.spec.ts` (dep: T008, T017)
- [x] T022 Crear `src/app/app.routes.ts` con las rutas perezosas (`loadComponent`) como marcadores de las páginas `/login`, `/loans`, `/admin/loans`, `/admin/users`, `/admin/limits`, `/forbidden` y `**` → `/login`; cada historia sustituye su marcador (dep: T020, T021)

**Punto de control**: fundamentos listos; las historias de usuario pueden comenzar.

---

## Fase 3: Historia de usuario 1 – Iniciar sesión (Prioridad: P1) 🎯 MVP

**Objetivo**: acceso con correo y contraseña, errores claros y llegada a la vista del rol (FR-001 a FR-004, FR-010).

**Prueba independiente**: en modo mock, iniciar sesión con cada rol y probar credenciales incorrectas, el bloqueo y el límite de solicitudes.

### Pruebas de la historia 1 ⚠️ (escribir primero y comprobar que fallan)

- [x] T023 [P] [US1] Pruebas del estado de sesión en `src/app/store/auth/auth.reducer.spec.ts` y `auth.selectors.spec.ts`: estado inicial, `login`, `loginSuccess`, `loginFailure`, `clearNotice` y `selectIsAuthenticated` (hay token y `expiresAt` en el futuro)
- [x] T024 [P] [US1] Pruebas de los efectos de login en `src/app/store/auth/auth.effects.spec.ts`: éxito navega a `/admin/loans` para Admin y a `/loans` para Borrower; 401 produce el mensaje genérico; 423 y 429 guardan el tiempo de espera; error de red produce `unexpected`; el token no se escribe en el almacenamiento
- [x] T025 [P] [US1] Pruebas de la página de acceso en `src/app/core/auth/login/login.page.spec.ts`: correo vacío o con formato inválido y contraseña vacía muestran error junto al campo y no envían; un solo envío aunque se pulse varias veces; mensaje genérico ante 401; mensaje de bloqueo con el tiempo de espera; muestra el aviso de la sesión expirada; la pista de credenciales solo en modo demostración
- [x] T026 [P] [US1] Pruebas del mock de login en `src/app/core/mock/mock-auth.spec.ts`: credenciales válidas devuelven token y `user`; correo inexistente y contraseña errónea dan el mismo 401; 5 fallos con el mismo correo (exista o no) dan 423 con `Retry-After` durante 15 minutos (reloj simulado); usuario desactivado da 401; `fail500@test.com` da 500

### Implementación de la historia 1

- [x] T027 [US1] Crear el estado de sesión `src/app/store/auth/auth.state.ts`, `auth.actions.ts`, `auth.reducer.ts` y `auth.selectors.ts` (campos y selectores de `data-model.md`; el token solo en memoria) y registrarlo en `src/app/app.config.ts` (dep: T020, T023)
- [x] T028 [US1] Crear `src/app/store/auth/auth.effects.ts` con `login$` (llama a `AuthApi.login`, errores con `toAppError`) y `loginSuccess$` (navega según el rol; el retorno a la pantalla pedida se añade en US2) y registrarlo en `src/app/app.config.ts` (dep: T015, T027, T024)
- [x] T029 [US1] Crear la página `src/app/core/auth/login/login.page.ts|html|scss`: Reactive Form (correo obligatorio y con formato, contraseña obligatoria), mostrar u ocultar contraseña, botón con indicador y deshabilitado mientras se envía, banner de error (401 genérico, 423 y 429 con el tiempo de espera formateado en minutos y segundos, `unexpected` genérico), aviso de sesión expirada y pista de credenciales de ejemplo solo si `environment.useMockApi`; añadir las etiquetas a `src/app/core/i18n/labels.ts` (dep: T017, T018, T028, T025)
- [x] T030 [US1] Añadir al mock `POST /api/auth/login` en `src/app/core/mock/mock-routes-auth.ts` y registrarlo en `mock-api.interceptor.ts`: validación 422 con `errors.email` y `errors.password`, 401 genérico, bloqueo 5/15 por correo (exista o no) con 423 y `Retry-After`, usuario desactivado como 401, token con 10 minutos de vida y la entrada mágica `fail500@test.com` (dep: T019, T026)
- [x] T031 [US1] Sustituir en `src/app/app.routes.ts` el marcador de `/login` por la página de acceso y redirigir `''` a `/login` (dep: T022, T029)

**Punto de control**: la historia 1 es funcional y probable por sí sola (`npm run start:mock`).

---

## Fase 4: Historia de usuario 2 – Mantener y cerrar la sesión de forma segura (Prioridad: P1) 🎯 MVP

**Objetivo**: sesión de 10 minutos solo en memoria, cierre manual y automático, 401 y rutas protegidas (FR-005 a FR-010).

**Prueba independiente**: cerrar sesión, dejar caducar una sesión (reloj simulado), recargar y abrir direcciones directas con y sin sesión y con cada rol.

### Pruebas de la historia 2 ⚠️

- [x] T032 [P] [US2] Pruebas de los guards en `src/app/core/guards/guards.spec.ts`: `authGuard` (sin sesión, sesión vencida y válida) redirige a `/login?returnUrl=…` (también al volver atrás a una ruta privada sin sesión); `adminGuard` y `borrowerGuard` con el rol equivocado redirigen a la vista propia con aviso; `guestGuard` con sesión redirige a la vista propia
- [x] T033 [P] [US2] Pruebas de los interceptores en `src/app/core/interceptors/interceptors.spec.ts`: `authInterceptor` añade `Authorization: Bearer` solo a URLs de `API_BASE_URL` y solo con token; `errorInterceptor` despacha `sessionExpired` ante 401 de cualquier petición autenticada, no ante el 401 de `login` ni de `logout`, avisa en 403 y siempre relanza el error
- [x] T034 [P] [US2] Pruebas de los efectos de sesión en `src/app/store/auth/auth.session.spec.ts` (con `fakeAsync`): al `loginSuccess` el temporizador dispara `sessionExpired` a los 10 minutos y se cancela con `logout`; `logout` llama a `POST /api/auth/logout`, limpia el estado y navega a `/login` con `replaceUrl` aunque la llamada falle; `sessionExpired` deja el aviso `expired`
- [x] T035 [P] [US2] Pruebas de `src/app/core/auth/return-url.spec.ts`: acepta rutas internas y rechaza `//sitio.com`, `https://…`, `\\`, vacío y rutas con esquema
- [x] T036 [P] [US2] Prueba en `src/app/store/auth/no-storage.spec.ts` de que tras `loginSuccess`, `logout` y `sessionExpired` ni `localStorage`, `sessionStorage` ni `document.cookie` contienen ningún dato (constitución VI, SC-008)

### Implementación de la historia 2

- [x] T037 [US2] Crear `src/app/core/auth/return-url.ts` (`sanitizeReturnUrl`: solo rutas internas que empiezan por `/` y no por `//`, sin esquema ni `\`) (dep: T035)
- [x] T038 [US2] Crear los guards `src/app/core/guards/auth.guard.ts`, `role.guard.ts` (`adminGuard` y `borrowerGuard`) y `guest.guard.ts` según las pruebas de T032 (dep: T027, T037, T032)
- [x] T039 [US2] Crear `src/app/core/interceptors/auth.interceptor.ts` y `error.interceptor.ts` y registrarlos en `src/app/app.config.ts` antes del interceptor del mock (dep: T020, T027, T016, T033)
- [x] T040 [US2] Ampliar `src/app/store/auth/auth.effects.ts`: `expiry$` (temporizador hasta `expiresAt`, cancelado por `logout`), `logout$` (llama a `AuthApi.logout`, ignora el fallo, limpia el estado y navega a `/login` con el aviso `loggedOut`), `sessionExpired$` (limpia el estado y navega a `/login` con el aviso) y el retorno a `returnUrl` en `loginSuccess$` si el rol lo permite (dep: T028, T037, T034)
- [x] T041 [US2] Conectar en `src/app/app.component.ts|html` el correo, el chip del rol, la navegación según el rol (Prestamista: "Mis préstamos"; Administrador: "Solicitudes") y el botón "Cerrar sesión", visibles solo con sesión (dep: T021, T040)
- [x] T042 [US2] Aplicar los guards en `src/app/app.routes.ts` (`/login` con `guestGuard`; `/loans` con `authGuard` y `borrowerGuard`; `/admin/**` con `authGuard` y `adminGuard`), crear `src/app/core/auth/forbidden/forbidden.page.ts` y la redirección de `**` a la vista propia o a `/login` (dep: T038, T031)
- [x] T043 [US2] Ampliar el mock con `POST /api/auth/logout` (revoca el `jti` hasta la expiración) y la validación del token en toda ruta protegida (401 si falta, está vencido o revocado) en `src/app/core/mock/mock-routes-auth.ts` y `mock-api.interceptor.ts` (dep: T030)

**Punto de control**: las historias 1 y 2 funcionan de forma independiente.

---

## Fase 5: Historia de usuario 3 – Solicitar un préstamo (Prioridad: P1) 🎯 MVP

**Objetivo**: el prestamista solicita un préstamo con validación del lado del cliente y errores del servidor por campo (FR-011, FR-012).

**Prueba independiente**: con sesión de prestamista, enviar una solicitud válida y comprobar que queda Pendiente; probar montos y plazos inválidos y fuera de los límites.

### Pruebas de la historia 3 ⚠️

- [x] T044 [P] [US3] Pruebas del estado y de los efectos de solicitud en `src/app/store/loans/loans.reducer.spec.ts` y `loans.effects.spec.ts`: `loadLimits` y `create` (éxito: aviso y recarga de "Mis préstamos"; 422: `submitError.fieldErrors` en el estado; error inesperado); `loadLimits` se despacha cada vez que se abre la vista
- [x] T045 [P] [US3] Pruebas de los validadores en `src/app/shared/validators/loan.validators.spec.ts`: monto 0, negativo, con 3 decimales, menor que el mínimo y mayor que el máximo, y los valores límite exactos; plazo 0, 61, 1,5, vacío y los límites 1 y 60; los límites se leen del estado y se revalidan cuando cambian
- [x] T046 [P] [US3] Pruebas del formulario de solicitud en `src/app/features/loans/loan-request-form/loan-request-form.component.spec.ts`: la ayuda muestra los límites y el plazo; error junto al campo y sin envío cuando es inválido; un solo envío aunque se pulse varias veces; el error 422 del servidor aparece junto a su campo y desaparece al editar; el formulario se limpia al terminar; al abrir la vista se piden de nuevo los límites

### Implementación de la historia 3

- [x] T047 [US3] Crear el estado de préstamos `src/app/store/loans/loans.state.ts`, `loans.actions.ts`, `loans.reducer.ts` y `loans.selectors.ts` (listas, filtro, estados de carga, `submitStatus` y `submitError`, `decidingIds` y los límites `limits`, `limitsStatus`, `limitsSaveStatus` y `limitsError`, según `data-model.md`; los límites viven en este slice) y registrarlo de forma perezosa con `provideState` en las rutas (dep: T020, T044)
- [x] T048 [US3] Crear `src/app/store/loans/loans.effects.ts` con `loadLimits$` y `create$` (éxito: aviso y `loadMine`; fallo: errores por campo en el estado) (dep: T015, T016, T047)
- [x] T049 [US3] Crear `src/app/shared/validators/loan.validators.ts` (`TERM_MIN`, `TERM_MAX`, validador de plazo y de monto contra los límites vigentes) (dep: T045)
- [x] T050 [US3] Crear la vista del prestamista `src/app/features/loans/loans.page.ts|html|scss` y el formulario `loan-request-form/loan-request-form.component.ts|html|scss` (monto y plazo, ayuda con los límites, aplicar `applyServerErrors`, `StateView` mientras se cargan los límites; la vista despacha `loadLimits` cada vez que se abre, FR-023), registrar la ruta `/loans` en `src/app/app.routes.ts` y añadir las etiquetas a `labels.ts` (dep: T017, T018, T048, T049, T046)
- [x] T051 [US3] Añadir al mock `GET /api/parameters/loan-limits` y `POST /api/loans` en `src/app/core/mock/mock-routes-loans.ts` (solo Borrower; validación 422 con los mismos mensajes que el backend: monto > 0, 2 decimales, dentro de los límites; plazo 1–60; el préstamo nace Pendiente con el prestamista del token) (dep: T043, T019)

**Punto de control**: las historias 1 a 3 funcionan.

---

## Fase 6: Historia de usuario 4 – Ver mis préstamos y su estado (Prioridad: P1) 🎯 MVP

**Objetivo**: el prestamista ve solo sus préstamos con su estado, con estados de carga, vacío y error (FR-013, FR-014).

**Prueba independiente**: con préstamos en los tres estados, comprobar que se ven solo los propios y los tres estados de la vista.

### Pruebas de la historia 4 ⚠️

- [x] T052 [P] [US4] Pruebas en `src/app/store/loans/loans.selectors.spec.ts` y `loans.effects.spec.ts`: `selectMyLoans` ordena del más reciente al más antiguo; `loadMine$` éxito y error
- [x] T053 [P] [US4] Pruebas de la lista en `src/app/features/loans/my-loans-list/my-loans-list.component.spec.ts`: carga, vacío ("Aún no tienes solicitudes"), error con "Reintentar" y datos con monto en USD, plazo, estado con icono y texto, y fechas `dd/MM/yyyy HH:mm`

### Implementación de la historia 4

- [x] T054 [US4] Añadir `loadMine$` a `src/app/store/loans/loans.effects.ts` y el selector `selectMyLoans` a `loans.selectors.ts` (dep: T048, T052)
- [x] T055 [US4] Crear `src/app/features/loans/my-loans-list/my-loans-list.component.ts|html|scss` (tabla desde 768 px y tarjetas apiladas por debajo, `CurrencyPipe` con `currencyCode` y `locale` de `environment`, `DatePipe` con `dd/MM/yyyy HH:mm`, `StatusChip`, `StateView`) y mostrarla en `loans.page.html` (dep: T017, T050, T054, T053)
- [x] T056 [US4] Añadir al mock `GET /api/loans/mine` en `src/app/core/mock/mock-routes-loans.ts` (solo Borrower, solo los propios, más recientes primero) y préstamos semilla del prestamista en los tres estados en `mock-db.ts` (dep: T051)

**Punto de control**: las historias 1 a 4 funcionan.

---

## Fase 7: Historia de usuario 5 – Ver todas las solicitudes (Prioridad: P1) 🎯 MVP

**Objetivo**: el administrador ve todas las solicitudes con filtro por estado y botón "Actualizar" (FR-015, FR-016).

**Prueba independiente**: con préstamos de varios prestamistas, comprobar la lista completa, el filtro, el contador de pendientes y que un prestamista no accede.

### Pruebas de la historia 5 ⚠️

- [x] T057 [P] [US5] Pruebas en `src/app/store/loans/loans.reducer.spec.ts` y `loans.selectors.spec.ts`: `filter` por defecto `Pending` (solo en el cliente), `selectAllLoansFiltered` filtra la lista completa, `selectPendingCount` cuenta los Pendientes de la lista completa sea cual sea el filtro, y el orden de más reciente a más antiguo
- [x] T058 [P] [US5] Pruebas de `loadAll$` en `src/app/store/loans/loans.effects.spec.ts`: llama a `LoansApi.listAll()` sin `status` (lista completa); cambiar el filtro no genera una petición; éxito y error
- [x] T059 [P] [US5] Pruebas de la página en `src/app/features/admin/admin-loans/admin-loans.page.spec.ts`: filtro Todos, Pendiente, Aprobado y Rechazado con Pendiente por defecto y contador visible; cambiar el filtro no hace peticiones nuevas y el contador no cambia; botón "Actualizar" recarga conservando el filtro; mensaje "No hay solicitudes con este filtro"; estados de carga y error; tarjetas en pantallas estrechas

### Implementación de la historia 5

- [x] T060 [US5] Ampliar `src/app/store/loans/loans.reducer.ts`, `loans.actions.ts` y `loans.selectors.ts` con `loadAll`, `setFilter` (solo en el cliente) y los selectores `selectAllLoansFiltered` y `selectPendingCount` (dep: T047, T057)
- [x] T061 [US5] Añadir `loadAll$` a `src/app/store/loans/loans.effects.ts` (dep: T048, T058)
- [x] T062 [US5] Crear `src/app/features/admin/admin-loans/admin-loans.page.ts|html|scss` (tabla con prestamista, monto, plazo, estado, fechas y quién decidió; `mat-button-toggle` de filtro con contador de pendientes; botón "Actualizar"; tarjetas por debajo de 768 px; `StateView`), registrar la ruta `/admin/loans` en `src/app/app.routes.ts` y añadir las etiquetas a `labels.ts` (dep: T017, T060, T061, T059)
- [x] T063 [US5] Añadir al mock `GET /api/loans?status=` en `src/app/core/mock/mock-routes-loans.ts` (solo Admin, filtro opcional, 400 si el valor es inválido, más recientes primero) y préstamos semilla de varios prestamistas en `mock-db.ts` (dep: T056)

**Punto de control**: las historias 1 a 5 funcionan.

---

## Fase 8: Historia de usuario 6 – Aprobar o rechazar una solicitud (Prioridad: P1) 🎯 MVP

**Objetivo**: el administrador decide sobre solicitudes pendientes con confirmación, sin doble envío y manejando el conflicto (FR-017, FR-018).

**Prueba independiente**: decidir sobre una pendiente y comprobar el nuevo estado; intentar decidir una ya decidida.

### Pruebas de la historia 6 ⚠️

- [x] T064 [P] [US6] Pruebas de `decide$` en `src/app/store/loans/loans.effects.spec.ts` y de `decidingIds` en `loans.reducer.spec.ts`: éxito recarga la lista con el filtro actual; 409 avisa "ya fue decidida por otra persona" y recarga; otros errores avisan y la solicitud queda como estaba; se envía `{ version }`; `selectIsDeciding(id)`
- [x] T065 [P] [US6] Pruebas de las acciones en `src/app/features/admin/admin-loans/admin-loans.decisions.spec.ts`: Aprobar y Rechazar solo en filas Pendientes; el diálogo de confirmación muestra prestamista, monto y plazo; al cancelar no se envía nada; varias pulsaciones seguidas envían una sola decisión; las filas decididas no ofrecen acciones

### Implementación de la historia 6

- [x] T066 [US6] Añadir `decide$` a `src/app/store/loans/loans.effects.ts`, `decide` y `decidingIds` a `loans.actions.ts` y `loans.reducer.ts` y `selectIsDeciding` a `loans.selectors.ts` (dep: T061, T064)
- [x] T067 [US6] Añadir a `admin-loans.page.html|ts` los botones Aprobar y Rechazar solo en filas Pendientes, el `ConfirmDialog` con prestamista, monto y plazo, el indicador por fila y los botones deshabilitados mientras la decisión está en curso (dep: T062, T066, T065)
- [x] T068 [US6] Añadir al mock `POST /api/loans/{id}/approve` y `/reject` en `src/app/core/mock/mock-routes-loans.ts` (solo Admin; cuerpo opcional con `version`; 409 si el préstamo ya está decidido o la versión no coincide; 404 si no existe; registra quién y cuándo y sube la versión) (dep: T063)

**Punto de control — CORTE DE MVP (parte funcional)**: con las historias 1 a 6 y el modo demostración (US7) está el flujo central completo: login → solicitar → mis préstamos → lista del administrador → decidir.

---

## Fase 9: Historia de usuario 7 – Usar la aplicación sin backend (Prioridad: P1) 🎯 MVP

**Objetivo**: ejecutar toda la interfaz sin backend, con datos de ejemplo y el comportamiento del servidor; sin rastro del mock en producción (FR-028 a FR-030, SC-010).

**Prueba independiente**: arrancar en modo demostración y recorrer las historias P1; compilar para producción y comprobar que no hay código del mock.

### Pruebas de la historia 7 ⚠️

- [x] T069 [P] [US7] Pruebas de las reglas del mock en `src/app/core/mock/mock-rules.spec.ts`: 403 por rol en rutas ajenas, 409 en la segunda decisión y con versión desactualizada, 401 con token vencido (reloj simulado) y tras `logout`, validaciones y mensajes iguales a los del backend, un prestamista solo ve sus préstamos

### Implementación de la historia 7

- [x] T070 [P] [US7] Crear `scripts/check-mock-routes.mjs` y el script `contract:check-mock` de `package.json`: extrae las rutas `route('METHOD', '/api/...')` de `src/app/core/mock/mock-routes-*.ts` y falla si alguna operación de `specs/001-web-ui/contracts/openapi.yaml` que usa la interfaz no está cubierta (dep: T019)
- [x] T071 [US7] Crear el aviso `src/app/shared/components/demo-banner/demo-banner.component.ts` ("Modo demostración: datos de ejemplo que se pierden al recargar"), mostrarlo en `src/app/app.component.html` solo cuando `environment.useMockApi` y verificar que los datos semilla de `src/app/core/mock/mock-db.ts` cubren los tres estados y varios prestamistas, y la entrada mágica `fail500@test.com` (dep: T021, T063)
- [x] T072 [US7] Crear `scripts/check-no-mock-in-prod.mjs` y el script `check:prod` de `package.json`: compila `production` y falla si `dist/` contiene cadenas exclusivas del mock (por ejemplo `fail500@test.com` o el marcador `__CBL_MOCK_API__` de `mock-api.interceptor.ts`) (dep: T019, T071)

**Punto de control — CORTE DE MVP**: las historias 1 a 7 funcionan; todo se puede demostrar sin backend.

---

## Fase 10: Historia de usuario 8 – Gestionar usuarios (Prioridad: P2)

**Objetivo**: el administrador crea, consulta, actualiza, desactiva y reactiva usuarios con las protecciones de su propia cuenta (FR-019 a FR-021).

**Prueba independiente**: crear un usuario, editarlo, desactivarlo y reactivarlo; comprobar los errores por campo y la protección de la propia fila.

### Pruebas de la historia 8 ⚠️

- [x] T073 [P] [US8] Pruebas del estado y de los efectos en `src/app/store/users/users.reducer.spec.ts`, `users.selectors.spec.ts` y `users.effects.spec.ts`: `loadUsers`, `createUser` y `updateUser` con éxito (recarga la lista) y fallo (409 duplicado → error en `email`; 403 de la propia cuenta → mensaje)
- [x] T074 [P] [US8] Pruebas de los validadores en `src/app/shared/validators/user.validators.spec.ts`: correo válido y máximo 256, nombre obligatorio y máximo 200, contraseña de 7 (inválida) y 8 (válida) y máximo 200, opcional al editar, rol `Admin` o `Borrower`
- [x] T075 [P] [US8] Pruebas de la página y del diálogo en `src/app/features/admin/users/users.page.spec.ts`: lista con usuarios desactivados distinguidos visualmente; errores junto a cada campo; la fila propia tiene bloqueados desactivar y cambiar el rol con una explicación; estados de carga, vacío y error

### Implementación de la historia 8

- [x] T076 [US8] Crear el estado `src/app/store/users/users.state.ts`, `users.actions.ts`, `users.reducer.ts` y `users.selectors.ts` y registrarlo de forma perezosa en las rutas de administración (dep: T020, T073)
- [x] T077 [US8] Crear `src/app/store/users/users.effects.ts` (`loadUsers$`, `createUser$`, `updateUser$`; recarga la lista al guardar; 409 con `errors.email` a `fieldErrors`) (dep: T015, T076)
- [x] T078 [US8] Crear `src/app/shared/validators/user.validators.ts` (correo, nombre, contraseña de 8 a 200 y rol) (dep: T074)
- [x] T079 [US8] Crear `src/app/features/admin/users/users.page.ts|html|scss` y `user-dialog/user-dialog.component.ts|html|scss` (lista con nombre, correo, rol, estado y fecha; alta y edición en un diálogo con Reactive Forms; interruptor de activo; contraseña obligatoria al crear y opcional al restablecer; fila propia con los controles bloqueados y explicación; `StateView`), registrar la ruta `/admin/users` en `src/app/app.routes.ts` y el enlace "Usuarios" en `src/app/app.component.html`, y añadir las etiquetas a `labels.ts` (dep: T017, T018, T077, T078, T075, T041)
- [x] T080 [US8] Añadir al mock `GET /api/users`, `POST /api/users` y `PUT /api/users/{id}` en `src/app/core/mock/mock-routes-users.ts` (solo Admin; contraseña de al menos 8; correo duplicado sin distinguir mayúsculas → 409 con `errors.email`; un admin no puede desactivarse ni cambiarse el rol → 403; un usuario desactivado no inicia sesión) (dep: T068)

**Punto de control**: las historias 1 a 8 funcionan.

---

## Fase 11: Historia de usuario 9 – Gestionar los límites de monto (Prioridad: P2)

**Objetivo**: el administrador consulta y modifica los límites; el formulario del prestamista usa los vigentes (FR-022, FR-023).

**Prueba independiente**: modificar los límites y comprobar que el formulario de solicitud valida con los valores nuevos.

### Pruebas de la historia 9 ⚠️

- [x] T081 [P] [US9] Pruebas de `saveLimits$` en `src/app/store/loans/loans.effects.spec.ts` y `loans.reducer.spec.ts`: éxito actualiza `limits` y avisa "se aplica solo a las solicitudes nuevas"; 422 deja `limitsError.fieldErrors` en `minAmount` y `maxAmount`
- [x] T082 [P] [US9] Pruebas de los validadores en `src/app/shared/validators/limits.validators.spec.ts`: mínimo ≤ 0, máximo ≤ mínimo, más de 2 decimales y por encima del tope de 1.000.000.000.000
- [x] T083 [P] [US9] Pruebas de la página en `src/app/features/admin/limits/limits.page.spec.ts`: muestra el mínimo y el máximo vigentes, valida antes de enviar, muestra el aviso tras guardar y los errores del servidor junto a cada campo

### Implementación de la historia 9

- [x] T084 [US9] Añadir `saveLimits$` a `src/app/store/loans/loans.effects.ts` y `saveLimits` con sus estados a `loans.actions.ts` y `loans.reducer.ts` (dep: T048, T081)
- [x] T085 [US9] Crear `src/app/shared/validators/limits.validators.ts` (mínimo > 0, máximo > mínimo, 2 decimales y tope) (dep: T082)
- [x] T086 [US9] Crear `src/app/features/admin/limits/limits.page.ts|html|scss` (formulario con mínimo y máximo, carga de los vigentes, nota "Se aplica solo a las solicitudes nuevas"), registrar la ruta `/admin/limits` en `src/app/app.routes.ts` y el enlace "Límites" en `src/app/app.component.html`, y añadir las etiquetas a `labels.ts` (dep: T017, T018, T084, T085, T083, T041)
- [x] T087 [US9] Añadir al mock `PUT /api/parameters/loan-limits` en `src/app/core/mock/mock-routes-loans.ts` (solo Admin; 422 con `errors.minAmount` y `errors.maxAmount`; el cambio aplica a las solicitudes nuevas) (dep: T051, T086)

**Punto de control**: las nueve historias funcionan.

---

## Fase 12: Pulido y asuntos transversales

**Propósito**: CI, entrega, endurecimiento, accesibilidad, documentación y validación final.

- [x] T088 Crear `.github/workflows/ci.yml`: en `push` y `pull_request`, Node 22 y `npm ci`; `npm run lint`; `npm test`; `npm run build`; `npm run build:mock`; `npm run contract:check`; `npm run contract:check-mock`; `npm run check:prod`; `npm run contract:sync` (no bloqueante); subir `dist/` como artefacto (dep: T006, T007, T009, T070, T072)
- [x] T089 Crear `.github/workflows/release.yml`: un tag `v*.*.*` reconstruye, ejecuta las pruebas y crea un GitHub Release con el zip del build de producción (`cbl-web-<tag>.zip`) y `SHA256SUMS.txt`, solo con `GITHUB_TOKEN` y sin despliegue en ningún entorno (dep: T088)
- [x] T090 Crear `scripts/check-hardening.mjs` y el script `check:hardening` de `package.json` (falla si `src/` contiene `localStorage`, `sessionStorage`, `innerHTML` o `bypassSecurityTrust`) y añadirlo como paso de `.github/workflows/ci.yml` (dep: T088)
- [x] T091 [P] Revisión de accesibilidad y diseño adaptable con el navegador integrado a 360, 768 y 1280 px en todas las pantallas construidas (etiquetas en cada campo, foco visible, avisos con `aria-live`, diálogos con teclado, estados no solo por color, sin desplazamiento horizontal) y corregir lo que se encuentre en `src/app/**` (dep: T067, T072 y, si se construyen, T079 y T086)
- [x] T092 [P] Actualizar `README.md` y `README.es.md` (ejecutar con el mock y contra la API real, `config.json`, scripts, pruebas, estructura, comportamiento de la sesión: token en memoria, 10 minutos, recargar pierde la sesión, estado de las fases de Spec Kit) (dep: T072)
- [x] T093 [P] Crear los ADR bilingües `docs/decisions/0027-mock-by-file-replacement.md`, `0028-session-logout-and-return-url.md`, `0029-types-generated-from-openapi.md` y `0030-runtime-config.md` y añadir sus filas a `docs/decisions/README.md` (dep: T072)
- [x] T094 Revisión de seguridad: ningún secreto ni clave en el repositorio ni en el historial, `.gitignore` correcto, `npm audit --omit=dev` sin vulnerabilidades altas o críticas, `git diff --cached` revisado en los archivos generados (dep: T090)
- [x] T095 Validar el `specs/001-web-ui/quickstart.md` (escenarios 1 a 23) en modo demostración con el navegador integrado y registrar los resultados en `specs/001-web-ui/quickstart-results.md`, confirmando SC-001 (menos de 1 minuto) y SC-010 (historias P1 sin backend) (dep: T086, T091)
- [x] T096 Verificación final: `npm run lint`, `npm test`, `npm run build`, `npm run build:mock`, `npm run contract:check`, `npm run contract:check-mock`, `npm run check:prod` y `npm run check:hardening` en verde, primer CI en verde en GitHub Actions, y actualizar `docs/speckit-log.md` y el estado de los README (dep: T089, T094, T095)

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Preparación (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundamentos (Fase 2)**: depende de la Fase 1 y BLOQUEA todas las historias.
- **Historias (Fases 3–11)**: dependen de los Fundamentos. Las historias P1 se construyen en orden porque se apoyan unas en otras (sesión → solicitar → mis préstamos → administrador → decidir); US8 y US9 son independientes entre sí y solo exigen US1 y US2.
- **Pulido (Fase 12)**: depende de las historias deseadas; T088, T090 y T092 forman parte del MVP.

### Dependencias entre historias

- **US1 (login)**: tras los Fundamentos; sin dependencias de otras historias.
- **US2 (sesión)**: tras US1 (usa el estado y los efectos de `auth`).
- **US3 (solicitar)**: tras US2 (rutas protegidas y sesión) y comparte el slice `loans`.
- **US4 (mis préstamos)**: tras US3 (comparte el estado de `loans` y la vista del prestamista).
- **US5 (lista del administrador)**: tras US2; amplía el slice `loans` de US3.
- **US6 (decidir)**: tras US5 (actúa sobre la lista del administrador).
- **US7 (modo demostración)**: la infraestructura está en los Fundamentos y las rutas del mock en cada historia; US7 añade el aviso, los datos semilla completos y las comprobaciones de cobertura y de exclusión en producción.
- **US8 y US9 (P2)**: tras US2; US9 amplía el slice `loans`; ambas se construyen cuando el MVP esté en verde.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de implementar.
- Estado antes que efectos; efectos antes que páginas; la ruta del mock junto a su historia.
- Una historia se completa (punto de control) antes de pasar a la siguiente.

### Oportunidades de paralelismo

- En la Fase 1: T002, T003, T006, T007 y T008 tras T001/T004.
- En la Fase 2: T011, T013 a T018 (archivos independientes) tras sus dependencias.
- Dentro de cada historia: todas las pruebas marcadas `[P]` juntas.
- US8 y US9 pueden hacerse en paralelo entre sí una vez cerrado el MVP; el resto de las historias P1 comparten estado y se hacen en orden.

### Ejemplo de paralelismo: historia 2

```text
# Pruebas de la historia 2, todas juntas:
Task: "Pruebas de los guards en src/app/core/guards/guards.spec.ts"                      (T032)
Task: "Pruebas de los interceptores en src/app/core/interceptors/interceptors.spec.ts"    (T033)
Task: "Pruebas de los efectos de sesión en src/app/store/auth/auth.session.spec.ts"       (T034)
Task: "Pruebas de returnUrl en src/app/core/auth/return-url.spec.ts"                      (T035)
Task: "Prueba de no-almacenamiento en src/app/store/auth/no-storage.spec.ts"              (T036)
```

---

## Estrategia de implementación

### Primero el MVP (historias 1 a 7)

1. Completar la Fase 1 (Preparación) y la Fase 2 (Fundamentos): crítico, bloquea todas las historias.
2. Completar US1 → US2 → US3 → US4 → US5 → US6 → US7, validando cada punto de control con `npm run start:mock`.
3. Añadir del Pulido solo lo necesario para el MVP: **T088** (`ci.yml`), **T090** (endurecimiento) y **T092** (README).
4. **DETENERSE Y VALIDAR**: login → solicitar → mis préstamos → lista del administrador → decidir, todo en modo demostración y el primer CI en verde.

### Entrega incremental

1. Preparación + Fundamentos → base lista.
2. Historias 1 a 7 → MVP demostrable sin backend.
3. US8 (usuarios) → US9 (límites), cada una probada de forma independiente.
4. Pulido restante: `release.yml` (T089), accesibilidad (T091), ADR (T093), revisión de seguridad (T094), validación del quickstart (T095) y verificación final (T096).

### Si falta tiempo (se recorta primero)

T093 → T089 → US9 → US8. Las historias P1, el CI y el endurecimiento no se recortan.

## Notas

- `[P]` = archivos distintos y sin dependencias pendientes.
- La etiqueta `[USn]` enlaza cada tarea con su historia para la trazabilidad.
- Cada historia debe poder completarse y probarse de forma independiente (con la salvedad de las dependencias entre historias indicada arriba).
- Verificar que las pruebas fallan antes de implementar.
- Un commit por tarea o por grupo lógico de tareas, con el identificador de la tarea (por ejemplo `feat(auth): login page (T029)`), y todo se sube a `main` en cada punto de control.
- Evitar tareas vagas, conflictos de archivo y dependencias entre historias que rompan su independencia.
