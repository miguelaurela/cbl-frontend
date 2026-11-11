# Spec Kit log – Frontend | Bitácora de Spec Kit – Frontend

Spec Kit artifacts are written in Spanish, so the prompts below are in Spanish. Fill in the date and "what I changed by hand" when running each phase.
Los artefactos de Spec Kit se redactan en español, por eso los prompts están en español. Completa la fecha y "qué cambié a mano" al ejecutar cada fase.

Spec Kit release tag used | Versión de Spec Kit usada: (TODO)

## Phase 1 – /speckit.constitution | Fase 1
- Date | Fecha:
- Prompt used (proposed, derived from the backend decisions; adjust before running) | Prompt usado (propuesto; ajústalo antes de ejecutarlo):

```
/speckit.constitution Redacta todos los artefactos en español. Crea los principios del proyecto "CBL Project (Control Banking Loans)" (frontend, repositorio cbl-frontend):

Arquitectura
- Angular 19 con standalone components, organizado en core (auth, api, interceptors, guards, models, errors), features (loans, admin), shared y store.
- Angular Material como librería de UI.
- Estado gestionado con NgRx (acciones, reducers, efectos, selectores) con slices auth, loans y users.
- Roles exactamente dos: Admin y Borrower (Prestamista). El código y los identificadores van en inglés; las etiquetas de la UI en español en un único archivo labels.ts, sin librería de i18n.

Seguridad
- El token JWT vive solo en memoria (store de NgRx); nunca en localStorage ni sessionStorage. Vida de 10 minutos, sin refresh token; un temporizador cierra la sesión automáticamente al expirar.
- Un interceptor añade el Bearer; otro cierra sesión y redirige al login ante 401.
- authGuard y roleGuard protegen rutas; el backend siempre revalida la autorización.
- No se renderiza HTML sin sanear.

Formularios y UX
- Reactive Forms con validadores que reflejan las reglas del backend (plazo 1–60 meses, monto dentro de los límites de la API).
- Los errores ProblemDetails se mapean a los campos del formulario o se muestran como mensaje claro.
- Estados de carga, error y vacío en todas las vistas; diseño responsive.

Desarrollo sin backend
- Configuración de build mock permanente: interceptor HTTP con datos en memoria que implementa el contrato de la API; documentada en el README y excluida de los builds de producción.

Calidad
- Pruebas unitarias de reducers, selectores, efectos, guards, interceptores y validadores.
- Todo cambio funcional se describe primero en la especificación.
- Se prioriza un MVP funcional antes del pulido.

Entrega
- Repositorio propio. El contrato con el backend es el OpenAPI de cbl-backend; se usa el mock mientras tanto.
- CI en GitHub Actions: lint, test y build.
- CD: el build de producción se adjunta como artefacto a un GitHub Release al publicar tags v*.*.*; no hay despliegue a ningún entorno.
- Documentación bilingüe: archivo en inglés por defecto y gemelo .es.md en español.
```
- What it generated | Qué generó:
- What I changed by hand and why | Qué cambié a mano y por qué:

## Phase 2 – /speckit.specify | Fase 2
- Date | Fecha:
- Prompt used | Prompt usado: reuse the backend prompt (`docs/speckit-log.md` in `cbl-backend`) limited to user stories 1–5 and 7 plus the users-management admin screen, keeping the "Interface" section (Interfaz) and the roles Prestamista (Borrower) / Administrador (Admin), without persistence rules. | Reutilizar el del backend (`docs/speckit-log.md` de `cbl-backend`) limitado a las historias de usuario 1–5 y 7 más la pantalla de gestión de usuarios del administrador, con la sección "Interfaz" y los roles Prestamista (Borrower) / Administrador (Admin), sin reglas de persistencia.
- What I changed by hand and why | Qué cambié a mano y por qué:

## Phase 3 – /speckit.clarify | Fase 3
- Date | Fecha:
- Questions and answers | Preguntas y respuestas:

## Phase 4 – /speckit.plan | Fase 4
- Date | Fecha:
- Prompt used | Prompt usado: (pin Angular 19, Angular Material, NgRx, Reactive Forms, the API base URL from `environment`, the `mock` configuration, and the backend OpenAPI copied to `specs/001-web-ui/contracts/openapi.yaml` | fijar Angular 19, Angular Material, NgRx, Reactive Forms, la URL base de la API desde `environment`, la configuración `mock` y el OpenAPI del backend copiado en `specs/001-web-ui/contracts/openapi.yaml`)
- What I changed by hand and why | Qué cambié a mano y por qué:

## Phase 5 – /speckit.tasks | Fase 5
## Phase 6 – /speckit.analyze | Fase 6
## Phase 7 – /speckit.implement | Fase 7
