# ADR-0027: Mock API excluded from production by file replacement / Mock excluido de producción por sustitución de archivos

- Status: Accepted
- Date: 2026-11-11

## Context
The constitution (principle V) requires a permanent `mock` configuration that is excluded from production builds. A runtime flag (`useMockApi`) would still ship the mock code and its sample credentials in the production bundle.

## Decision
- The mock lives in `src/app/core/mock/` and is wired in only through `mock-api.providers.ts`, which exports an **empty** list of interceptors.
- The `mock` configuration in `angular.json` uses `fileReplacements` to swap `mock-api.providers.ts` for `mock-api.providers.mock.ts` (the real interceptor) and `environment.ts` for `environment.mock.ts`. The flag `useMockApi` only shows the demo banner and the login hint.
- The mock interceptor is registered **last** in the HTTP chain, so the real interceptors (Bearer, 401) behave as in production.
- `npm run check:prod` builds for production and fails if `dist/` contains mock-only strings; `npm run contract:check-mock` fails if the mock misses an operation of the contract that the UI uses. Both run in CI.

## Alternatives considered
- Runtime flag only: the mock code would be in the production bundle.
- A separate Angular application or library for the mock: more build configuration for a single-purpose interceptor.

## Consequences
The production bundle contains no mock code. The mock must be kept in sync with the OpenAPI contract; the scripts make drift visible in CI. A new mock route must be added to a `mock-routes-*.ts` file as `route('METHOD', '/api/...')` so the checker can see it.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
La constitución (principio V) exige una configuración `mock` permanente que quede excluida de los builds de producción. Una bandera en tiempo de ejecución (`useMockApi`) seguiría incluyendo en el bundle de producción el código del mock y sus credenciales de ejemplo.

### Decisión
- El mock vive en `src/app/core/mock/` y se conecta solo a través de `mock-api.providers.ts`, que exporta una lista **vacía** de interceptores.
- La configuración `mock` de `angular.json` usa `fileReplacements` para cambiar `mock-api.providers.ts` por `mock-api.providers.mock.ts` (el interceptor real) y `environment.ts` por `environment.mock.ts`. La bandera `useMockApi` solo muestra el aviso de demostración y la pista del login.
- El interceptor del mock se registra **al final** de la cadena HTTP, de modo que los interceptores reales (Bearer y 401) se comportan igual que en producción.
- `npm run check:prod` compila para producción y falla si `dist/` contiene cadenas exclusivas del mock; `npm run contract:check-mock` falla si al mock le falta una operación del contrato que usa la interfaz. Ambos corren en el CI.

### Alternativas consideradas
- Solo una bandera en tiempo de ejecución: el código del mock iría en el bundle de producción.
- Una aplicación o librería Angular aparte para el mock: más configuración de build para un interceptor de un solo uso.

### Consecuencias
El bundle de producción no contiene código del mock. El mock debe mantenerse alineado con el contrato OpenAPI; los scripts hacen visible la deriva en el CI. Una ruta nueva del mock debe añadirse en un archivo `mock-routes-*.ts` como `route('METHOD', '/api/...')` para que el verificador la vea.
