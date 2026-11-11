# ADR-0028: Session timer, server-side logout and validated returnUrl / Temporizador de sesión, cierre en el servidor y returnUrl validado

- Status: Accepted
- Date: 2026-11-11

## Context
ADR-0013 keeps the JWT only in memory for 10 minutes. The backend now revokes tokens (`POST /api/auth/logout`), locks a login after repeated failures (423) and rate-limits requests (429). The clarifications asked to return to the requested screen after signing in.

## Decision
- A timer (NgRx effect) closes the session at `expiresAt`; a 401 on any authenticated request also closes it. The 401 of `login` and `logout` is **not** treated as an expired session.
- Manual logout calls `POST /api/auth/logout` first (the token is still in the store so the request is authenticated); a failure is ignored and the local session is always cleared. Navigation uses `replaceUrl` so "back" does not reveal private screens.
- After expiry or logout the state of `loans` and `users` is emptied.
- `authGuard` redirects to `/login?returnUrl=…`. `returnUrl` is accepted only if it is an internal path (starts with `/`, not `//`, no backslash or control characters) and the role may open it; otherwise the user goes to their own view.
- Session data is never written to `localStorage`, `sessionStorage` or cookies; a test and the `check:hardening` script enforce it.

## Alternatives considered
- Local-only logout: the token would stay valid on the server until it expires.
- Refresh token or "remember me": out of scope and against ADR-0013.
- Accepting any `returnUrl`: an open-redirect risk.

## Consequences
Reloading the page loses the session (expected). Two parallel 401s may navigate to the login twice, which is harmless. Because `returnUrl` is not kept on expiry, nothing typed in a form survives an expired session.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El ADR-0013 mantiene el JWT solo en memoria durante 10 minutos. El backend ahora revoca tokens (`POST /api/auth/logout`), bloquea un login tras fallos repetidos (423) y limita las solicitudes (429). Las aclaraciones pidieron volver a la pantalla pedida tras iniciar sesión.

### Decisión
- Un temporizador (efecto de NgRx) cierra la sesión en `expiresAt`; un 401 en cualquier petición autenticada también la cierra. El 401 de `login` y de `logout` **no** se trata como sesión vencida.
- El cierre manual llama primero a `POST /api/auth/logout` (el token sigue en el store, así la petición va autenticada); un fallo se ignora y la sesión local siempre se limpia. La navegación usa `replaceUrl` para que "atrás" no muestre pantallas privadas.
- Tras caducar o cerrar sesión se vacían los estados de `loans` y `users`.
- `authGuard` redirige a `/login?returnUrl=…`. `returnUrl` solo se acepta si es una ruta interna (empieza por `/`, no por `//`, sin barras invertidas ni caracteres de control) y el rol puede abrirla; en otro caso se va a la vista propia.
- Los datos de sesión nunca se escriben en `localStorage`, `sessionStorage` ni cookies; una prueba y el script `check:hardening` lo garantizan.

### Alternativas consideradas
- Cierre solo local: el token seguiría válido en el servidor hasta expirar.
- Refresh token o "recordarme": fuera de alcance y contrario al ADR-0013.
- Aceptar cualquier `returnUrl`: riesgo de redirección abierta.

### Consecuencias
Recargar la página pierde la sesión (esperado). Dos 401 en paralelo pueden navegar dos veces al acceso, lo cual es inofensivo. Como `returnUrl` no se conserva al caducar, nada de lo escrito en un formulario sobrevive a una sesión vencida.
