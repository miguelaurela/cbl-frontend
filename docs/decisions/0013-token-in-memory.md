# ADR-0013: Token only in memory / Token solo en memoria

- Status: Accepted
- Date: 2026-11-11

## Context
The JWT is sensitive; where the browser stores it determines the XSS risk.

## Decision
The token lives only in the NgRx store (never in `localStorage` or `sessionStorage`). It is short-lived: **10 minutes**, no refresh token (backend ADR-0009). An effect starts a timer at `expiresAt` when login succeeds and dispatches `sessionExpired`, which logs the user out and shows a "session expired" notice on the login screen; manual logout cancels the timer. One interceptor adds the Bearer header to API requests; another logs out on 401. For development without a backend, the `mock` build configuration (ADR-0025) issues JWT-shaped tokens that also expire after 10 minutes, so the expiry logic is exercised for real.

## Alternatives considered
- `sessionStorage` (survives refresh, vulnerable to XSS).
- `localStorage`.

## Consequences
The session is lost on page refresh. Natural evolution: refresh token in an `HttpOnly` cookie, mentioned in the theory part (question 5).

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El token JWT es sensible; el almacenamiento en el navegador condiciona el riesgo ante XSS.

### Decisión
El token vive solo en el store de NgRx (nunca en `localStorage` ni `sessionStorage`). Es de vida corta: **10 minutos**, sin refresh token (ADR-0009 del backend). Un efecto arranca un temporizador a `expiresAt` al iniciar sesión y despacha `sessionExpired`, que cierra la sesión y muestra un aviso de "sesión expirada" en el login; el cierre de sesión manual cancela el temporizador. Un interceptor añade el Bearer a las peticiones a la API y otro cierra sesión ante 401. Para desarrollar sin backend, la configuración de build `mock` (ADR-0025) emite tokens con forma de JWT que también expiran a los 10 minutos, de modo que la lógica de expiración se ejercita de verdad.

### Alternativas consideradas
- `sessionStorage` (sobrevive al refresco, vulnerable a XSS).
- `localStorage`.

### Consecuencias
La sesión se pierde al refrescar. Evolución natural: refresh token en cookie `HttpOnly`, que se menciona en la teoría (pregunta 5).
