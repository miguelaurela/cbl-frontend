# Plan de implementación: CBL Project – Interfaz web (frontend)

**Rama**: `001-web-ui` | **Fecha**: 2026-11-11 | **Especificación**: [spec.md](spec.md)

**Entrada**: especificación de la funcionalidad en `specs/001-web-ui/spec.md` (9 historias, 30 requisitos funcionales, 13
criterios de éxito, aclaraciones del 2026-11-11).

## Resumen

Aplicación Angular 19 (componentes standalone, Angular Material, NgRx, Reactive Forms) que consume la API del backend: acceso
con sesión solo en memoria de 10 minutos y cierre en el servidor, vista del prestamista (solicitar y ver sus préstamos), vista
del administrador (todas las solicitudes con filtro, aprobar y rechazar con confirmación) y, después del MVP, gestión de
usuarios y de los límites de monto. Enfoque técnico (detalle en [research.md](research.md)): estado en `auth`, `loans` (con los
límites) y `users`; solo los efectos llaman a la API; tipos generados desde el OpenAPI del backend; errores `ProblemDetails`
mapeados a campos o mensajes; y un modo demostración `mock` permanente, separado del build de producción por sustitución de
archivos, que reproduce el comportamiento del servidor.

**Alcance y orden**: el MVP son las historias 1 a 7 (acceso, sesión, solicitar, mis préstamos, lista del administrador,
decidir y modo demostración); las historias 8 (usuarios) y 9 (límites) se construyen cuando el MVP esté en verde (ADR-0025).

## Contexto técnico

**Lenguaje/Versión**: TypeScript 5.8 (estricto) sobre Angular 19.2.x; Node 22 LTS en CI y 18.19.1+ en local.

**Dependencias principales**: Angular 19.2.25 (`core`, `router`, `forms`, `common/http`), Angular Material y CDK 19.2.19,
NgRx `store`, `effects` y `store-devtools` 19.2.1, RxJS 7.8, zone.js 0.15; en desarrollo: `openapi-typescript` 7,
angular-eslint 19, Karma 6 y Jasmine 5.

**Almacenamiento**: ninguno en el navegador. El estado vive solo en memoria (NgRx); la sesión se pierde al recargar.

**Pruebas**: Karma + Jasmine con Chrome headless; `provideMockStore`, `provideMockActions`, `HttpTestingController` y
`fakeAsync`.

**Plataforma de destino**: navegadores modernos de escritorio y móvil (desde 360 px); artefacto estático servible desde
cualquier servidor web.

**Tipo de proyecto**: aplicación web de una sola página (SPA) cliente de una API REST.

**Metas de rendimiento**: acceso y solicitud de un préstamo en menos de 1 minuto (SC-001); nueva decisión visible en la lista
en menos de 2 s (SC-003); arranque rápido (presupuesto de tamaño
inicial del build de producción, aviso a 500 kB y error a 1 MB).

**Restricciones**: token solo en memoria y sin refresh token; sin despliegue en ningún entorno (el CD solo publica artefactos);
el mock no entra en el build de producción; documentación bilingüe.

**Escala/Alcance**: prueba técnica; 5 pantallas (acceso, prestamista, solicitudes, usuarios, límites), unas decenas de
usuarios y cientos de préstamos, sin paginación.

Sin marcadores `NEEDS CLARIFICATION` pendientes: todas las incógnitas se resuelven en [research.md](research.md).

## Verificación de la constitución

*Puerta: debe pasar antes de la Fase 0 de investigación; se re-evalúa tras el diseño de la Fase 1.*

| Principio | Cómo lo cumple el plan | Previo | Posterior |
|---|---|---|---|
| I. Arquitectura Angular por áreas y roles | `core`, `features` (`loans`, `admin`), `shared` y `store`; la página de login va en `core/auth` para no ampliar la lista de `features`; Angular Material; dos roles exactos; etiquetas en español en `labels.ts` sin i18n; USD con formato `en-US` desde `environment`. | Pasa | Pasa |
| II. Estado con NgRx | Slices `auth`, `loans` y `users`; los límites viven dentro de `loans` (no se crea un cuarto slice); componentes con selectores, solo los efectos llaman a la API; recarga desde la API tras decidir. | Pasa | Pasa |
| III. Seguridad por defecto | Token solo en memoria; 10 minutos con temporizador y sin refresh token; `POST /api/auth/logout` al cerrar sesión (la falla se ignora); interceptor Bearer solo a la API; interceptor de 401 que no actúa sobre login ni logout; `authGuard`/`roleGuard`; sin `innerHTML` ni `bypassSecurityTrust*`. | Pasa | Pasa |
| IV. Formularios, errores y estados | Reactive Forms con validadores que reflejan al backend; mapeo de `ProblemDetails` (422/400 a campos, 423 y 429 con `Retry-After`, `traceId` solo en errores inesperados); estados de carga, error y vacío en todas las vistas; responsive desde 360 px. | Pasa | Pasa |
| V. Modo demostración permanente | Configuración `mock` con sustitución de archivos: el build de producción nunca importa el mock; documentado en el README; script que comprueba que el mock cubre todo el contrato; reproduce 423, logout y expiración. | Pasa | Pasa |
| VI. Calidad y pruebas | Specs de reducers, selectores, efectos, guards, interceptores y validadores; prueba de que el token no toca el almacenamiento del navegador. | Pasa | Pasa |
| VII. Especificación primero y MVP | Cada pantalla remite a historias y requisitos; el corte de MVP es explícito (historias 1 a 7). | Pasa | Pasa |
| Restricciones y flujo | Repo propio; contrato = OpenAPI del backend conciliado ([conciliación](contracts/reconciliation.md)) y comprobado en CI; CI de lint, pruebas y build; CD solo artefactos en tags; documentación bilingüe; ADR desde el 0027. | Pasa | Pasa |

**Resultado**: sin violaciones; no hace falta la sección de seguimiento de complejidad.

## Desviaciones respecto al borrador `docs/planning/tasks-frontend.md`

El borrador se escribió antes del backend real y de las aclaraciones. `/speckit-tasks` lo usará solo como base.

| # | Borrador | Plan | Motivo |
|---|---|---|---|
| D1 | Slice `parameters` para los límites | Los límites van dentro del slice `loans` | La constitución (II) enumera `auth`, `loans` y `users` |
| D2 | Modelos escritos a mano; generar tipos "opcional" | Tipos **generados** con `openapi-typescript` y comprobados en CI | Evita la deriva entre modelos y contrato |
| D3 | Errores: 401, 403 y 5xx | Además 423 y 429 con `Retry-After`; `traceId` solo en errores inesperados | Backend real y aclaración 1 |
| D4 | Cierre de sesión solo local | Llama a `POST /api/auth/logout`; el interceptor de 401 no actúa sobre `login` ni `logout` | FR-007 y backend |
| D5 | Decidir con `version` "opcional" | Siempre envía `{ version }` | Una decisión sobre datos desactualizados recibe 409 |
| D6 | Nombre de usuario máximo 100 | Máximo 200 | Límite real del backend |
| D7 | Sin retorno a la pantalla pedida | `returnUrl` validado | Aclaración 2 |
| D8 | Sin botón de actualizar | Botón "Actualizar" en la lista del administrador, sin sondeo | Aclaración 3 |
| D9 | Flujo `frontend.yml` | `ci.yml` y `release.yml` (como el backend) | Coherencia entre repositorios y entrega en tags |
| D10 | Mock activado por bandera `useMockApi` | Mock excluido por **sustitución de archivos**; la bandera solo muestra el aviso | El código del mock no puede llegar a producción |
| D11 | URL de la API en el build | `public/config.json` en tiempo de ejecución | El mismo artefacto sirve para cualquier API |
| D12 | Fechas sin formato definido | `dd/MM/yyyy HH:mm` en la zona horaria del navegador | Aclaración 4 |
| D13 | Node 22 en todo | CI y `.nvmrc`: 22 LTS; local: 18.19.1+ | La máquina tiene 18.20.8 y 20.19.0 |

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/001-web-ui/
├── plan.md              # Este archivo (salida de /speckit-plan)
├── research.md          # Fase 0: decisiones y alternativas
├── data-model.md        # Fase 1: tipos del contrato, estado de NgRx, validaciones y transiciones
├── quickstart.md        # Fase 1: guía de validación de extremo a extremo
├── contracts/
│   ├── openapi.yaml     # Copia del contrato del backend (cbl-backend@f92f9d5)
│   └── reconciliation.md # Conciliación con el contrato que asumía el frontend (FE-74)
├── checklists/
│   └── requirements.md  # Calidad de la especificación
└── tasks.md             # Fase 2 (/speckit-tasks; NO lo crea /speckit-plan)
```

### Código fuente (raíz del repositorio)

```text
package.json  package-lock.json  angular.json  tsconfig*.json  eslint.config.js  karma.conf.js
.nvmrc  .editorconfig
public/
└── config.json                  # { "apiBaseUrl": "..." } leído antes de arrancar
scripts/
├── check-mock-routes.mjs        # el mock cubre las operaciones de openapi.yaml
└── check-contract-sync.mjs      # avisa si la copia difiere de la del backend
src/
├── index.html  main.ts  styles.scss          # tema Material 3 y tokens
├── environments/                 # environment.ts, environment.mock.ts, environment.prod.ts
└── app/
    ├── app.component.*  app.config.ts  app.routes.ts
    ├── core/
    │   ├── api/                  # auth.api, loans.api, users.api, parameters.api, API_BASE_URL, openapi.generated.ts
    │   ├── auth/                 # página de login, utilidades de sesión y de returnUrl
    │   ├── config/               # configuración en tiempo de ejecución
    │   ├── errors/               # AppError y toAppError
    │   ├── guards/               # auth, role (admin/borrower) y guest
    │   ├── i18n/                 # labels.ts
    │   ├── interceptors/         # auth.interceptor y error.interceptor
    │   ├── mock/                 # mock-api.providers.ts (vacío) y .mock.ts (real), interceptor, base en memoria, token
    │   ├── models/               # alias de los tipos generados
    │   └── notifications/        # envoltorio de MatSnackBar
    ├── features/
    │   ├── loans/                # vista del prestamista: formulario de solicitud y "Mis préstamos"
    │   └── admin/                # solicitudes, usuarios (+ diálogo) y límites
    ├── shared/                   # state-view, status-chip, confirm-dialog, validadores y ayudantes de formularios
    └── store/                    # auth/, loans/ y users/ (acciones, reducer, efectos, selectores)
.github/workflows/
├── ci.yml                        # lint, pruebas, builds (producción y mock), contrato y endurecimiento
└── release.yml                   # tag v*.*.* → GitHub Release con el zip de producción
```

**Decisión de estructura**: una sola aplicación Angular con la estructura que fija la constitución (principio I). El código del
mock está en `core/mock` pero solo se compila en la configuración `mock`.

## Seguimiento de complejidad

Sin violaciones de la constitución; no aplica.
