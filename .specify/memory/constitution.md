# Constitución de CBL Project (Control Banking Loans) – Frontend

Interfaz web (Angular 19) del sistema de gestión de préstamos bancarios (simulación): los prestamistas solicitan préstamos y
los administradores los aprueban o rechazan. Este documento rige el repositorio `cbl-frontend`. Los artefactos de Spec Kit se
redactan en español; el código y los identificadores, en inglés.

## Principios fundamentales

### I. Arquitectura Angular por áreas y roles exactos

- La aplicación es Angular 19 con componentes standalone, organizada en `core` (auth, api, interceptors, guards, models,
  errors), `features` (loans, admin), `shared` y `store`.
- La librería de UI MUST ser Angular Material.
- Los roles son exactamente dos: `Admin` y `Borrower` (en la interfaz, Administrador y Prestamista). El código y los
  identificadores MUST estar en inglés.
- Las etiquetas de la interfaz MUST estar en español y concentrarse en un único archivo `labels.ts`, sin librería de i18n.
  Los importes se muestran en USD con formato `en-US`, configurable en `environment`.

**Razón**: una estructura previsible por responsabilidad mantiene la prueba acotada y fácil de revisar.

### II. Estado con NgRx

- El estado MUST gestionarse con NgRx (acciones, reducers, efectos y selectores) con los slices `auth`, `loans` y `users`.
- Los componentes MUST leer el estado mediante selectores y modificarlo despachando acciones; los efectos MUST ser los únicos
  que llaman a la API a través de los servicios de `core/api`.
- Tras aprobar o rechazar, la lista MUST refrescarse desde la API.

**Razón**: un flujo de datos unidireccional hace el estado trazable y probable.

### III. Seguridad por defecto (NO NEGOCIABLE)

- El token JWT MUST vivir solo en memoria (store de NgRx); NUNCA en `localStorage`, `sessionStorage`, cookies ni
  IndexedDB. Vive 10 minutos, no hay refresh token y un temporizador MUST cerrar la sesión automáticamente al expirar
  (según `expiresAt` de la respuesta de login). Perder la sesión al recargar la página es el comportamiento esperado.
- Un interceptor MUST añadir la cabecera `Authorization: Bearer` a las peticiones a la API. Otro MUST cerrar la sesión y
  redirigir al login ante un 401 de cualquier petición autenticada; el 401 del propio login (credenciales incorrectas) MUST
  mostrarse como error del formulario y no cerrar sesión ni redirigir.
- Al cerrar sesión de forma manual, la aplicación MUST llamar a `POST /api/auth/logout` para revocar el token en el servidor
  y después descartar el estado local; si la llamada falla, la sesión local se cierra igualmente.
- `authGuard` y `roleGuard` (`adminGuard` y `borrowerGuard`) MUST proteger las rutas. Un usuario sin sesión o sin el rol
  requerido MUST ser redirigido. El backend siempre revalida la autorización: los guards son solo experiencia de usuario.
- NUNCA se renderiza HTML sin sanear, y no se almacenan secretos ni claves en el código ni en el repositorio.

**Razón**: es una aplicación financiera simulada; el token en memoria reduce el impacto de un XSS y el cierre de sesión
en servidor evita que un token "cerrado" siga siendo válido.

### IV. Formularios, errores y estados de la interfaz

- Los formularios MUST ser Reactive Forms con validadores que reflejen las reglas del backend: plazo entero de 1 a 60
  meses y monto mayor que 0, con 2 decimales como máximo y dentro de los límites que expone la API (el backend es la
  fuente de verdad).
- Los errores `ProblemDetails` (`application/problem+json`) MUST mapearse así: 400 y 422 a los campos del formulario según
  `errors` (claves en camelCase) o, si no hay campo, a un mensaje claro; 401 de login como credenciales incorrectas;
  403, 404 y 409 como mensaje claro; 423 (correo bloqueado) y 429 (límite de solicitudes) como mensaje con el tiempo de
  espera de `Retry-After`; cualquier otro error y los fallos de red como mensaje genérico, sin detalles internos.
- Todas las vistas MUST mostrar estados de carga, de error y de lista vacía, y el diseño MUST ser responsive.

**Razón**: el usuario entiende qué pasó y qué hacer, y la interfaz nunca queda en blanco ni congelada.

### V. Desarrollo sin backend (configuración mock permanente)

- El proyecto MUST incluir una configuración de build `mock` permanente: un interceptor HTTP con datos en memoria que
  implementa el contrato de la API (mismos datos semilla, mismos códigos de estado, bloqueo de login con 423, cierre de
  sesión y expiración incluidos).
- La configuración `mock` MUST documentarse en el README y MUST quedar excluida de los builds de producción.
- El mock MUST mantenerse alineado con el contrato OpenAPI del backend.

**Razón**: permite desarrollar y demostrar la interfaz completa sin backend.

### VI. Calidad y pruebas

- Las pruebas unitarias MUST cubrir reducers, selectores, efectos, guards, interceptores y validadores.
- Una prueba MUST verificar que el token nunca se escribe en `localStorage` ni en `sessionStorage`.

**Razón**: la autenticación y el estado son lo que más se rompe sin que se note.

### VII. Especificación primero y MVP antes que pulido

- Todo cambio funcional MUST describirse primero en la especificación y MUST implementarse con tareas trazables.
- Se MUST priorizar un MVP funcional antes que el pulido, dado el tiempo limitado de la prueba.

**Razón**: la trazabilidad especificación → plan → tareas → código es el propósito de Spec Kit.

## Restricciones técnicas y de entrega

- El frontend vive en su propio repositorio (`cbl-frontend`). El contrato con el backend (`cbl-backend`) es su OpenAPI; el
  mock se usa mientras el backend no esté disponible. La copia del contrato en este repositorio se concilia con la del
  backend.
- CI en GitHub Actions: lint, pruebas y build.
- CD solo publica artefactos: al subir un tag `v*.*.*` se adjunta a un GitHub Release el build de producción. NO hay
  despliegue en ningún entorno.
- La documentación es bilingüe: archivo en inglés por defecto y gemelo `.es.md` en español.

## Flujo de desarrollo y puertas de calidad

- El trabajo avanza por las fases de Spec Kit (constitución, especificación, aclaración, plan, tareas, análisis,
  implementación) y cada fase se registra en `docs/speckit-log.md`.
- Todo lo que se crea se commitea y se sube al repositorio; `main` es la rama donde debe estar todo y las ramas de trabajo
  se integran en ella con `--no-ff`, sin reescribir el historial.
- Una fusión MUST verificar el cumplimiento de esta constitución. Cualquier complejidad adicional MUST justificarse por
  escrito.
- Las decisiones arquitectónicas se registran como ADR en `docs/decisions/`; una decisión cambiada se documenta en un ADR
  nuevo que reemplaza al anterior, sin editarlo. La numeración de los ADR se comparte con `cbl-backend`: los nuevos de este
  repositorio empiezan en el 0027.

## Gobernanza

Esta constitución prevalece sobre cualquier otra práctica del repositorio. Una enmienda MUST documentarse con su
justificación, aprobarse por el responsable del proyecto y, si altera un principio, incluir un plan de migración del código
afectado. El versionado sigue SemVer: MAJOR para eliminaciones o redefiniciones incompatibles de principios, MINOR para
principios o secciones nuevas o ampliaciones materiales, PATCH para aclaraciones y correcciones de redacción. El
cumplimiento se revisa en cada fase de Spec Kit (especialmente `analyze`) y en cada fusión.

**Versión**: 1.0.0 | **Ratificada**: 2026-11-11 | **Última enmienda**: 2026-11-11
