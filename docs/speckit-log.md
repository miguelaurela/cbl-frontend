# Spec Kit log – Frontend | Bitácora de Spec Kit – Frontend

Spec Kit artifacts are written in Spanish, so the prompts below are in Spanish. Fill in the date and "what I changed by hand" when running each phase.
Los artefactos de Spec Kit se redactan en español, por eso los prompts están en español. Completa la fecha y "qué cambié a mano" al ejecutar cada fase.

Spec Kit release tag used | Versión de Spec Kit usada: `specify-cli` 1.4.1.dev0 (instalado con `uv tool install --python 3.12`). Integraciones: Claude Code (predeterminada) y GitHub Copilot. Agente que ejecuta las fases: Claude Code. En esta versión los comandos son skills con guion (`/speckit-constitution`, …).

## Phase 1 – /speckit.constitution | Fase 1
- Date | Fecha: 2026-11-11
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
- What it generated | Qué generó: `.specify/memory/constitution.md` v1.0.0 (ratificada 2026-11-11) con 7 principios (arquitectura Angular por áreas y roles exactos; estado con NgRx; seguridad por defecto; formularios, errores y estados de la interfaz; desarrollo sin backend con configuración `mock`; calidad y pruebas; especificación primero y MVP), una sección de restricciones técnicas y de entrega, una de flujo de desarrollo y la gobernanza.
- Deviations from the proposed prompt | Desviaciones del prompt propuesto (el prompt se escribió antes de implementar el backend; se ajustó a lo que el backend ya hace): (1) el cierre de sesión manual llama a `POST /api/auth/logout` y descarta el estado local aunque la llamada falle; (2) el interceptor de 401 solo cierra sesión en peticiones autenticadas: el 401 del propio login se muestra como error del formulario; (3) el mapeo de `ProblemDetails` incluye 423 (bloqueo de login) y 429 con el tiempo de espera de `Retry-After`; (4) el mock reproduce también el bloqueo 423, el cierre de sesión y la expiración. Además se añadieron las reglas del usuario (todo se commitea y sube; `main` es la rama donde debe estar todo; ramas integradas con `--no-ff`) y que los ADR nuevos del frontend empiezan en el 0027 (el 0026 es del backend).
- What I changed by hand and why | Qué cambié a mano y por qué: nada aparte de lo anterior; aprobada por el usuario tal como se generó. / Nothing beyond the above; approved by the user as generated.

## Phase 2 – /speckit.specify | Fase 2
- Agent | Agente: Claude Code (`/speckit-specify`). Rama `001-web-ui` creada a mano (no hay extensión de git instalada).
- Date | Fecha: 2026-11-11
- Prompt used | Prompt usado: reuse the backend prompt (`docs/speckit-log.md` in `cbl-backend`) limited to user stories 1–5 and 7 plus the users-management admin screen, keeping the "Interface" section (Interfaz) and the roles Prestamista (Borrower) / Administrador (Admin), without persistence rules. | Reutilizar el del backend (`docs/speckit-log.md` de `cbl-backend`) limitado a las historias de usuario 1–5 y 7 más la pantalla de gestión de usuarios del administrador, con la sección "Interfaz" y los roles Prestamista (Borrower) / Administrador (Admin), sin reglas de persistencia.
- What it generated | Qué generó: `specs/001-web-ui/spec.md` (9 historias de usuario: 7 P1 y 2 P2; 30 requisitos funcionales; 12 criterios de éxito; casos límite, supuestos y fuera de alcance; 0 marcadores de aclaración), `specs/001-web-ui/checklists/requirements.md` (validado, 1 iteración) y `.specify/feature.json`. Historias: 1 iniciar sesión, 2 mantener y cerrar la sesión, 3 solicitar un préstamo, 4 mis préstamos, 5 lista del admin con filtro, 6 aprobar o rechazar, 7 modo demostración sin backend (P1); 8 gestión de usuarios y 9 límites de monto (P2).
- Adjustments for the already-built backend | Ajustes por el backend ya construido: logout que llega al servidor, bloqueo de login (423) con tiempo de espera y límite de solicitudes (429), 401 del login como error del formulario, errores `ProblemDetails` por campo, protección de la propia cuenta del admin (no desactivarse ni cambiarse el rol) y un modo demostración que reproduce todo eso.
- Unconfirmed assumptions to settle in Phase 3 | Supuestos sin confirmar para la Fase 3: confirmación breve antes de aprobar o rechazar; código de referencia (`traceId`) en los errores genéricos; volver a la pantalla pedida tras expirar la sesión; la interfaz no ofrece editar ni eliminar préstamos propios; la pantalla de límites entra en el alcance (historia 9).
- What I changed by hand and why | Qué cambié a mano y por qué: nada; aprobada por el usuario tal como se generó. / Nothing; approved by the user as generated.

## Phase 3 – /speckit.clarify | Fase 3
- Agent | Agente: Claude Code (`/speckit-clarify`). Rama `001-web-ui`.
- Date | Fecha: 2026-11-11
- Questions and answers | Preguntas y respuestas: el agente hizo el barrido de ambigüedades y resolvió 9 puntos (límite de la skill: 5 preguntas al usuario; se le hicieron 4). Quedaron registrados en `## Clarifications` de `spec.md`.
  - Respondidas por el usuario (4, opción recomendada en todas) | Answered by the user (4, recommended option each): (1) el `traceId` se muestra solo en errores inesperados; (2) tras iniciar sesión se vuelve a la pantalla pedida si el rol lo permite; (3) la lista del admin se actualiza con un botón "Actualizar" manual, sin sondeo; (4) fechas como `11/11/2026 17:30` (día/mes/año, 24 h, zona horaria del navegador).
  - Resueltas desde los documentos del repo, sin preguntar (5) | Resolved from repo documents, not asked (5): confirmación al aprobar o rechazar (FE-41 de `tasks-frontend.md`); sin editar ni eliminar préstamos propios en la interfaz (contrato asumido: "not used by the UI"); pantalla de límites en el alcance tras el MVP (ADR-0025, FE-52); al caducar la sesión se vuelve al acceso con un mensaje, sin aviso previo (ADR-0013, ADR-0020); accesibilidad (FE-70).
  - Supuesto por defecto NO confirmado | Unconfirmed default assumption: no hay aviso previo a la expiración de la sesión ni renovación.
- Spec changes | Cambios en el spec: FR-016, FR-024, FR-025 y FR-026 ajustados; escenario nuevo en la historia 5 (botón "Actualizar"); SC-013 añadido; caso límite nuevo; supuestos resueltos retirados. Total: 30 FR y 13 SC, 0 marcadores; checklist sin regresiones (15/15). / FR-016, 024, 025, 026 adjusted; new scenario in story 5; SC-013 added; new edge case; resolved assumptions removed.
- What I changed by hand and why | Qué cambié a mano y por qué: nada; aprobado por el usuario tal como se generó. / Nothing; approved by the user as generated.

## Phase 4 – /speckit.plan | Fase 4
- Agent | Agente: Claude Code (`/speckit-plan`). Rama `001-web-ui`.
- Date | Fecha: 2026-11-11
- Prompt used | Prompt usado: (pin Angular 19, Angular Material, NgRx, Reactive Forms, the API base URL from `environment`, the `mock` configuration, and the backend OpenAPI copied to `specs/001-web-ui/contracts/openapi.yaml` | fijar Angular 19, Angular Material, NgRx, Reactive Forms, la URL base de la API desde `environment`, la configuración `mock` y el OpenAPI del backend copiado en `specs/001-web-ui/contracts/openapi.yaml`)
- What it generated | Qué generó: `specs/001-web-ui/plan.md` (contexto técnico, verificación de la constitución sin violaciones, tabla de desviaciones D1–D13, estructura del proyecto), `research.md` (15 decisiones), `data-model.md` (tipos del contrato, estado de NgRx, validaciones, transiciones), `quickstart.md` (23 escenarios) y `contracts/` (`openapi.yaml`, copia del contrato del backend en `cbl-backend@f92f9d5`, y `reconciliation.md`, la conciliación FE-74 con los 9 puntos de la lista y las diferencias).
- Versions pinned | Versiones fijadas: Angular 19.2.x (core 19.2.25), Angular Material y CDK 19.2.19, NgRx 19.2.1, TypeScript 5.8, RxJS 7.8, zone.js 0.15, angular-eslint 19.8, Karma 6.4 + Jasmine 5, `openapi-typescript` 7. Node: CI y `.nvmrc` 22 LTS; local 18.19.1+ (la máquina tiene 18.20.8 y 20.19.0).
- Key decisions | Decisiones clave: los límites de monto viven en el slice `loans` (la constitución enumera tres slices); la página de login va en `core/auth`; tipos generados desde el OpenAPI con comprobación en CI; mock excluido del build de producción por sustitución de archivos (no por bandera); `config.json` en tiempo de ejecución para la URL de la API; `POST /api/auth/logout` al cerrar sesión; decidir envía siempre `{ version }`; `returnUrl` validado; `traceId` solo en errores inesperados.
- Reconciliation findings | Hallazgos de la conciliación: coinciden los 9 puntos; el backend añadió `POST /api/auth/logout`, no existe `DELETE /api/users/{id}`, el nombre de usuario admite 200 caracteres (no 100) y los mensajes de error del servidor vienen en español.
- Prompt applied | Prompt aplicado (resumen): fijar Angular 19, Angular Material, NgRx, Reactive Forms, la URL base desde `environment`, la configuración `mock` y el OpenAPI del backend copiado en `specs/001-web-ui/contracts/openapi.yaml`; usar `docs/planning/tasks-frontend.md` como borrador.
- What I changed by hand and why | Qué cambié a mano y por qué: nada; aprobado por el usuario tal como se generó. Antes de la aprobación el agente citó en research y plan los requisitos FR-027, FR-028 y los criterios SC-001 y SC-010, que no tenían referencia explícita. / Nothing; approved by the user as generated, after the agent added explicit references for FR-027, FR-028, SC-001 and SC-010.

## Phase 5 – /speckit.tasks | Fase 5
- Agent | Agente: Claude Code (`/speckit-tasks`). Rama `001-web-ui`.
- Date | Fecha: 2026-11-11
- Prompt applied | Prompt aplicado: usar `docs/planning/tasks-frontend.md` como base, ajustado al plan (desviaciones D1–D13).
- What it generated | Qué generó: `specs/001-web-ui/tasks.md` con 96 tareas (42 `[P]`): Preparación 8, Fundamentos 14, US1 9, US2 12, US3 8, US4 5, US5 7, US6 5, US7 4, US8 8, US9 7, Pulido 9. Incluye tareas de prueba (la constitución las exige), rutas exactas y las rutas del mock dentro de cada historia. Validado con un script: formato, IDs secuenciales, etiquetas por historia, dependencias sin referencias hacia adelante y una ruta en cada tarea.
- MVP cut | Corte de MVP: historias 1 a 7 más T088 (`ci.yml`), T090 (endurecimiento) y T092 (README); después US8 y US9. Recorte si falta tiempo: T093 (ADR) → T089 (`release.yml`) → US9 → US8.
- What I changed by hand and why | Qué cambié a mano y por qué: nada; aprobado por el usuario tal como se generó. Antes de la aprobación el agente añadió la cabecera de requisitos transversales (FR-024 a FR-027) a la fase de Fundamentos. / Nothing; approved by the user as generated, after the agent added the cross-cutting requirements header (FR-024 to FR-027) to the Foundations phase.

## Phase 6 – /speckit.analyze | Fase 6
- Agent | Agente: Claude Code (`/speckit-analyze`, solo lectura). Rama `001-web-ui`.
- Date | Fecha: 2026-11-11
- Result (pasted) | Resultado (pegado): 0 críticos, 1 alto, 4 medios, 4 bajos. Cobertura: 30/30 FR, 12/13 SC (faltaba SC-001), 9/9 historias, 65 de 96 tareas con etiqueta `[USn]`; los 7 principios de la constitución se cumplen. / 0 critical, 1 high, 4 medium, 4 low; coverage 30/30 FR, 12/13 SC, 9/9 stories; constitution passes.
  - A1 (alta): `selectPendingCount` no estaba definido y el filtro se enviaba como `status`, por lo que el contador daba 0 con el filtro "Aprobado". / The pending counter was undefined and the filter was sent as `status`.
  - A2 (media): T001 no fijaba el CLI de Angular 19.2. A3 (media): T020 registraba interceptores que se crean en T039. A4 (media): la recarga de límites (FR-023) estaba en T087 (US9, recortable). A5 (media): T091 solo revisaba las pantallas del MVP.
  - A6 a A9 (bajas): trazabilidad de SC-001 y SC-010; «atrás» tras cerrar sesión y cookies en T036; datos semilla del mock duplicados y marcador `__CBL_MOCK_API__`; caducidad con un formulario abierto.
- Corrections applied (all 9, approved by the user) | Correcciones aplicadas (las 9, aprobadas por el usuario): el filtro pasa a ser solo del cliente sobre la lista completa (T057 a T060, `data-model.md`, quickstart 11); T001 con `@angular/cli@19.2`; T020 solo registra el mock; `loadLimits` al abrir la vista en T044, T046 y T050 (fuera de T087); T091 para todas las pantallas construidas; SC-001 en el quickstart 6 y SC-010 en T095; «atrás», `replaceUrl` y cookies en T032, T034, T036 y quickstart 15; T019, T071 y T072 sin duplicar la semilla ni el marcador; caso límite de `spec.md` aclarado.
- What I changed by hand and why | Qué cambié a mano y por qué: nada fuera de las correcciones del informe. / Nothing beyond the report's corrections.

## Phase 7 – /speckit.implement | Fase 7

- Agent | Agente: Claude Code (`/speckit-implement`, por lotes). Rama `001-web-ui`; cada lote se integra en `main` con `--no-ff`.
- Date | Fecha: 2026-11-11
- Progress | Avance: T001 a T063 hechas (Preparación, Fundamentos y historias 1 a 5). Verificado en cada lote con `npm run lint`, `npm test` (171 pruebas), build de producción y de `mock`, y un recorrido en el navegador en modo demostración (login con retorno, cierre de sesión y "atrás", solicitud con validación, "Mis préstamos" y lista del administrador con filtro y contador).
- Decisions while implementing | Decisiones al implementar: `ng new` con `@angular/cli@19.2` en un directorio temporal; el estado de `loans` se registra una vez en una ruta padre sin ruta propia (`provideState` y `provideEffects`); el filtro de la lista del administrador es solo del cliente (corrección A1 del análisis); la caducidad no conserva `returnUrl` (A9); el mock copia con `structuredClone` los cuerpos para no compartir objetos con el estado inmutable de NgRx.
- Pending observation | Observación pendiente: el build de producción supera el aviso de 500 kB del presupuesto inicial (552 kB, el límite de error es 1 MB); se revisa en el pulido (T091).
