# ADR-0030: API URL read at run time from config.json / URL de la API leída en tiempo de ejecución desde config.json

- Status: Accepted
- Date: 2026-11-11

## Context
The draft put the API URL in `environment*.ts`, which fixes it at build time. The release workflow publishes one artifact that must work against any API, and there is no deployment to any environment.

## Decision
- `public/config.json` contains `{ "apiBaseUrl": "http://localhost:5000" }` and is copied unchanged into the build.
- An app initializer (`loadRuntimeConfig`) fetches it before the app starts and overrides `RUNTIME_CONFIG.apiBaseUrl`; the `API_BASE_URL` token reads that value. If the file is missing or invalid, the value of `environment` is kept.
- In the `mock` configuration the file is not downloaded.
- `config.json` holds only the API URL, never secrets.

## Alternatives considered
- Build-time `environment` only: one build per API.
- Injecting variables into `index.html` at deploy time: needs a deployment step that this project does not have.

## Consequences
To publish the release zip on any static server, unzip it and edit `config.json`. The backend must allow the origin of the site through its CORS configuration.

## Español

- Estado: Aceptada
- Fecha: 2026-11-11

### Contexto
El borrador ponía la URL de la API en `environment*.ts`, lo que la fija en tiempo de compilación. El flujo de release publica un solo artefacto que debe funcionar contra cualquier API, y no hay despliegue en ningún entorno.

### Decisión
- `public/config.json` contiene `{ "apiBaseUrl": "http://localhost:5000" }` y se copia sin cambios al build.
- Un inicializador de la aplicación (`loadRuntimeConfig`) lo descarga antes de arrancar y sustituye `RUNTIME_CONFIG.apiBaseUrl`; el token `API_BASE_URL` lee ese valor. Si el archivo falta o es inválido, se conserva el valor de `environment`.
- En la configuración `mock` el archivo no se descarga.
- `config.json` guarda solo la URL de la API, nunca secretos.

### Alternativas consideradas
- Solo `environment` en tiempo de compilación: un build por API.
- Inyectar variables en `index.html` al desplegar: exige un paso de despliegue que este proyecto no tiene.

### Consecuencias
Para publicar el zip del release en cualquier servidor estático basta descomprimirlo y editar `config.json`. El backend debe permitir el origen del sitio en su configuración de CORS.
