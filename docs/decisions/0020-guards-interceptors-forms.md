# ADR-0020: Guards, interceptors and Reactive Forms / Guards, interceptores y Reactive Forms

- Status: Accepted
- Date: 2026-11-11

## Context
The PDF asks for JWT with Guards, validation with Reactive Forms and a friendly interface.

## Decision
- `authGuard` (active, non-expired session) and `roleGuard(role)` (exposed as `adminGuard` / `borrowerGuard`; roles are `Admin` and `Borrower`) on routes; the backend always re-validates.
- One interceptor adds the Bearer header (only to requests to the API base URL); another logs out and redirects on 401 (except on the login call) and notifies on 403.
- Session expiry: a timer at the token's `expiresAt` (10 minutes) triggers automatic logout (ADR-0013).
- Reactive Forms with validators mirroring the backend rules (term 1–60 months, amount within the limits exposed by the API).
- Loading, error and empty states in every view; `ProblemDetails` errors mapped to form fields or shown as a clear message.
- A `mock` build configuration (HTTP interceptor with in-memory data, ADR-0025) lets the UI run without the backend; it is registered last in the interceptor chain so the auth and error interceptors still run.

## Alternatives considered
- Template-driven forms.
- Client-only access control (rejected: not a security barrier).

## Consequences
Validation rules are duplicated on client and server; the backend is the source of truth.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El PDF pide JWT con Guards, validaciones con Reactive Forms y una interfaz amigable.

### Decisión
- `authGuard` (sesión activa y no expirada) y `roleGuard(rol)` (expuesto como `adminGuard` / `borrowerGuard`; los roles son `Admin` y `Borrower`) en las rutas; el backend siempre revalida.
- Un interceptor añade el Bearer (solo a peticiones a la URL base de la API); otro cierra sesión y redirige ante 401 (salvo en la llamada de login) y avisa ante 403.
- Expiración de sesión: un temporizador a `expiresAt` del token (10 minutos) dispara el cierre de sesión automático (ADR-0013).
- Reactive Forms con validadores que reflejan las reglas del backend (plazo 1–60 meses, monto dentro de los límites que expone la API).
- Estados de carga, error y vacío en todas las vistas; errores `ProblemDetails` mapeados a campos del formulario o mostrados como mensaje claro.
- Una configuración de build `mock` (interceptor HTTP con datos en memoria, ADR-0025) permite ejecutar la UI sin backend; se registra al final de la cadena de interceptores para que los de auth y errores sigan ejecutándose.

### Alternativas consideradas
- Template-driven forms.
- Controlar el acceso solo en el cliente (descartada: no es una barrera de seguridad).

### Consecuencias
Las reglas de validación se duplican en cliente y servidor; la fuente de verdad es el backend.
