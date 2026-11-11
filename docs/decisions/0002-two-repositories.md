# ADR-0002: Two repositories / Dos repositorios

- Status: Accepted
- Date: 2026-11-11

## Context
Backend and frontend are independent projects.

## Decision
One repository per part (`cbl-backend`, `cbl-frontend`), each with its own Spec Kit. Contract: the backend OpenAPI.

## Alternatives considered
- Monorepo.

## Consequences
The backend must allow CORS from the frontend origin. A mock API (ADR-0025) can be used until the real API is available.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
Backend y frontend son proyectos independientes.

### Decisión
Un repositorio por parte (`cbl-backend`, `cbl-frontend`), cada uno con su propio Spec Kit. Contrato: OpenAPI del backend.

### Alternativas consideradas
- Monorepo.

### Consecuencias
El backend debe permitir CORS desde el origen del frontend. Se puede usar una API simulada (ADR-0025) hasta que la API real esté disponible.
