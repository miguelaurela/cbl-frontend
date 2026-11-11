# ADR-0029: API types generated from the backend OpenAPI / Tipos de la API generados desde el OpenAPI del backend

- Status: Accepted
- Date: 2026-11-11

## Context
The first draft of the frontend tasks had hand-written models. The backend now publishes an OpenAPI contract, and hand-written models drift from it silently.

## Decision
- `specs/001-web-ui/contracts/openapi.yaml` is a copy of the backend contract (`cbl-backend`, `specs/001-gestion-prestamos/contracts/openapi.yaml`).
- `openapi-typescript` generates `src/app/core/api/openapi.generated.ts` (`npm run contract:generate`); `src/app/core/models/index.ts` exposes readable aliases (`Loan`, `User`, `LoanLimits`, …).
- `npm run contract:check` regenerates the file and fails if `git diff` shows changes; it runs in CI.
- `npm run contract:sync` compares the copy with `cbl-backend@main` and only **warns** (non-blocking in CI), so a backend change does not break the frontend build by surprise.
- The generated file is excluded from ESLint and from the hardening scan.

## Alternatives considered
- Hand-written models: simple but they drift.
- Generating a full client: more code than the thin `*.api.ts` services need.

## Consequences
A contract change is a visible diff in a pull request. The copy must be updated by hand (and the types regenerated) when the backend contract changes.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El borrador inicial de tareas del frontend tenía modelos escritos a mano. El backend ahora publica un contrato OpenAPI y los modelos a mano se desvían de él sin avisar.

### Decisión
- `specs/001-web-ui/contracts/openapi.yaml` es una copia del contrato del backend (`cbl-backend`, `specs/001-gestion-prestamos/contracts/openapi.yaml`).
- `openapi-typescript` genera `src/app/core/api/openapi.generated.ts` (`npm run contract:generate`); `src/app/core/models/index.ts` expone alias legibles (`Loan`, `User`, `LoanLimits`, …).
- `npm run contract:check` regenera el archivo y falla si `git diff` detecta cambios; corre en el CI.
- `npm run contract:sync` compara la copia con `cbl-backend@main` y solo **avisa** (no bloquea el CI), para que un cambio del backend no rompa el build del frontend por sorpresa.
- El archivo generado se excluye de ESLint y del análisis de endurecimiento.

### Alternativas consideradas
- Modelos a mano: sencillos, pero se desvían.
- Generar un cliente completo: más código del que necesitan los servicios delgados `*.api.ts`.

### Consecuencias
Un cambio de contrato es un diff visible en una pull request. La copia debe actualizarse a mano (y regenerar los tipos) cuando cambia el contrato del backend.
