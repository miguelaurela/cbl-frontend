[English](README.md) | Español

# CBL Frontend – Control Banking Loans (Angular)

Cliente Angular para la prueba técnica de Makers, parte de **CBL Project (Control Banking Loans)**. Consume la API de `cbl-backend` (.NET).

## Stack
Angular 19 (standalone components) · Angular Material · NgRx (`auth`, `loans`, `users`) · Reactive Forms · interceptores HTTP y guards de ruta · TypeScript (estricto) · Karma + Jasmine

## Pantallas (referencia del PDF)
1. **Login**: correo y contraseña con validaciones; mensaje genérico ante credenciales incorrectas; mensajes de bloqueo y de límite de solicitudes con el tiempo de espera.
2. **Prestamista** (Borrower): formulario para solicitar un préstamo (monto y plazo) con los límites vigentes como ayuda, y lista "Mis préstamos" con estado.
3. **Administrador**: todas las solicitudes con filtro por estado (Pendiente por defecto), contador de pendientes, botón manual "Actualizar", y Aprobar y Rechazar con diálogo de confirmación. La gestión de usuarios y los límites de préstamo llegan después del MVP.

Credenciales de ejemplo (solo de demostración): `usuario@test.com` / `123` (Prestamista) y `admin@test.com` / `123` (Administrador).

## Comportamiento de la sesión
El JWT vive **solo en memoria** (NgRx): nunca se escribe en `localStorage`, `sessionStorage` ni cookies. Dura 10 minutos, no hay refresh token y un temporizador cierra la sesión al expirar. **Recargar la página pierde la sesión** (es lo esperado). "Cerrar sesión" llama a `POST /api/auth/logout` para revocar el token en el servidor y siempre limpia la sesión local. Tras iniciar sesión se vuelve a la pantalla pedida (validada contra redirecciones abiertas).

## Cómo ejecutar

Requisitos: Node.js 18.19.1 o superior (CI y `.nvmrc`: 22 LTS), npm 10 y Chrome para las pruebas.

```
npm ci
npm run start:mock   # http://localhost:4200, sin backend (modo demostración con datos de ejemplo)
npm start            # http://localhost:4200, contra la API real
```

La URL base de la API se lee en tiempo de ejecución desde [`public/config.json`](public/config.json) (`apiBaseUrl`, por defecto `http://localhost:5000`), de modo que el mismo build sirve para cualquier API. El backend permite por defecto el origen `http://localhost:4200`.

### Scripts

| Script | Qué hace |
|---|---|
| `npm run lint` | ESLint (prohíbe `localStorage`, `sessionStorage`, `innerHTML` y `bypassSecurityTrust*`) |
| `npm test` | Pruebas unitarias (Karma + Jasmine, Chrome headless, sin modo watch) |
| `npm run build` / `build:mock` | Build de producción / de demostración (`dist/cbl-web`, `dist/cbl-web-mock`) |
| `npm run contract:generate` / `contract:check` | Genera los tipos de la API desde `specs/001-web-ui/contracts/openapi.yaml` / falla si están desactualizados |
| `npm run contract:check-mock` | Falla si el mock no implementa una operación del contrato que usa la interfaz |
| `npm run contract:sync` | Avisa si la copia del contrato difiere de `cbl-backend@main` |
| `npm run check:hardening` | Falla si `src/` usa almacenamiento del navegador o HTML sin sanear |
| `npm run check:prod` | Build de producción y falla si contiene código del mock |

## API simulada (modo demostración)
El repo mantiene una configuración de build `mock` permanente: un interceptor HTTP con datos en memoria con los mismos datos semilla que el backend (los usuarios de ejemplo anteriores, límites 1.000–100.000 y préstamos en los tres estados). Reproduce el comportamiento del servidor: las mismas validaciones y mensajes, 403 por rol, 409 ante doble decisión o versión desactualizada, bloqueo de login tras 5 fallos durante 15 minutos (423 con `Retry-After`), cierre de sesión que revoca el token y expiración del token a los 10 minutos. Un aviso indica que los datos son de ejemplo y se pierden al recargar. Escribir `fail500@test.com` en el login fuerza un error 500.

El mock se **excluye de los builds de producción** por sustitución de archivos en `angular.json` (la configuración `mock` sustituye `mock-api.providers.ts`); `npm run check:prod` lo verifica (ADR-0025).

## Cómo se usa Spec Kit

Este proyecto se desarrolla con [GitHub Spec Kit](https://github.com/github/spec-kit), con asistencia de IA.

| Fase | Comando | Artefacto | Estado |
|---|---|---|---|
| 0 | Análisis manual | docs/00-analisis.es.md | Hecho |
| 1 | /speckit.constitution | .specify/memory/constitution.md | Hecho |
| 2 | /speckit.specify | specs/001-web-ui/spec.md | Hecho |
| 3 | /speckit.clarify | spec.md (Clarifications) | Hecho |
| 4 | /speckit.plan | plan.md, contracts/ | Hecho |
| 5 | /speckit.tasks | tasks.md | Hecho |
| 6 | /speckit.analyze | docs/speckit-log.md | Hecho |
| 7 | /speckit.implement | código | En curso: historias 1 a 7 (MVP) hechas; historias 8 y 9 y pulido pendientes |

## Documentación
- Prompts de Spec Kit por fase: [docs/speckit-log.md](docs/speckit-log.md)
- Especificación, plan y tareas: [specs/001-web-ui](specs/001-web-ui)
- Análisis: [docs/00-analisis.es.md](docs/00-analisis.es.md)
- Decisiones (índice de ADR): [docs/decisions/README.md](docs/decisions/README.md)
- Planificación: [CONTEXT](docs/planning/CONTEXT.md) · [tareas frontend](docs/planning/tasks-frontend.md) · [tareas repos/CI/CD](docs/planning/tasks-devops.md)
- Repo complementario: `cbl-backend`.
