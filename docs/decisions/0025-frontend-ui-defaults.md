# ADR-0025: Frontend UI defaults / Valores por defecto de la UI

- Status: Accepted
- Date: 2026-11-11

## Context
The PDF leaves several UI details open (currency, language, list size, how to demo without a backend, order of the optional screens). A technical-test scale and a ~2-hour estimate call for simple defaults.

## Decision
- **UI kit**: Angular Material.
- **Language**: UI labels in Spanish, kept in a single `labels.ts` file (no i18n library); code and identifiers in English.
- **Currency**: USD with `en-US` formatting, configurable in `environment` (`currencyCode`, `locale`).
- **Admin loans list**: plain list with a status filter, no pagination.
- **Mock API**: a permanent `mock` build configuration (HTTP interceptor with in-memory data, seeded like the backend) documented in the README and excluded from production builds.
- **Order of work**: the Admin users-management screen and the loan-limits screen are built after the MVP checklist is green. The users screen is required (the Admin role manages users); only its order is open.
- **MVP** = phases 0–4 of `docs/planning/tasks-frontend.md`.

## Alternatives considered
- i18n library (Transloco / `@angular/localize`): overkill for one language.
- Server-side pagination: only if the backend returns paged results.
- json-server for the mock: cannot express approval conflicts (409), lockout or token expiry.

## Consequences
Changing currency or locale is a one-line change. Adding a second UI language later requires introducing an i18n mechanism. Reviewers can run the whole UI with `npm run start:mock` (mock configuration) and no backend; the mock must stay in sync with the API contract.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El PDF deja abiertos varios detalles de la UI (moneda, idioma, tamaño de listas, cómo demostrar sin backend, orden de las pantallas opcionales). La escala de prueba técnica y la estimación de ~2 horas piden valores por defecto sencillos.

### Decisión
- **Librería de UI**: Angular Material.
- **Idioma**: etiquetas de la UI en español, en un único archivo `labels.ts` (sin librería de i18n); código e identificadores en inglés.
- **Moneda**: USD con formato `en-US`, configurable en `environment` (`currencyCode`, `locale`).
- **Lista de préstamos del admin**: lista simple con filtro por estado, sin paginación.
- **API simulada**: configuración de build `mock` permanente (interceptor HTTP con datos en memoria, con los mismos datos semilla que el backend), documentada en el README y excluida de los builds de producción.
- **Orden de trabajo**: la pantalla de gestión de usuarios del Admin y la de límites de préstamo se construyen cuando el checklist del MVP esté en verde. La pantalla de usuarios es obligatoria (el rol Admin gestiona usuarios); solo su orden queda abierto.
- **MVP** = fases 0–4 de `docs/planning/tasks-frontend.md`.

### Alternativas consideradas
- Librería de i18n (Transloco / `@angular/localize`): excesiva para un solo idioma.
- Paginación en servidor: solo si el backend devuelve resultados paginados.
- json-server para el mock: no puede expresar conflictos de aprobación (409), bloqueo de login ni expiración de token.

### Consecuencias
Cambiar moneda o formato es un cambio de una línea. Añadir un segundo idioma exigirá introducir un mecanismo de i18n. Los revisores pueden ejecutar toda la UI con `npm run start:mock` (configuración mock) sin backend; el mock debe mantenerse alineado con el contrato de la API.
