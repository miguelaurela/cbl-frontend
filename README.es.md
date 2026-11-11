[English](README.md) | Español

# CBL Frontend – Control Banking Loans (Angular)

Cliente Angular para la prueba técnica de Makers, parte de **CBL Project (Control Banking Loans)**. Consume la API de `cbl-backend` (.NET).

## Stack
Angular 19 (standalone components) · Angular Material · NgRx (`auth`, `loans`, `users`) · Reactive Forms · interceptores HTTP y guards de ruta

## Pantallas (referencia del PDF)
1. **Login**: correo y contraseña con validaciones.
2. **Prestamista** (Borrower): formulario para solicitar préstamo (monto y plazo) y lista "Mis préstamos" con estado.
3. **Administrador**: lista de solicitudes con Aprobar y Rechazar en las pendientes; la gestión de usuarios y los límites de préstamo llegan después del MVP.

Credenciales de ejemplo: `usuario@test.com` / `123` (Prestamista) y `admin@test.com` / `123` (Administrador). El token de sesión vive solo en memoria y expira a los 10 minutos.

> Estado actual: análisis y planificación completados. El código se generará con `/speckit.implement`.

## Cómo ejecutar

TODO hasta que la app esté implementada. Previsto:

```
npm ci
npm run start:mock   # sirve la app con la configuración `mock` (no requiere backend)
npm start            # sirve la app contra la API real (apiBaseUrl)
```

La URL base de la API y la configuración contra la API real se documentarán aquí cuando exista la app.

## API simulada (mock)
El repo mantiene una configuración de build `mock` permanente: un interceptor HTTP con datos en memoria con los mismos datos semilla que el backend (los usuarios de ejemplo anteriores, límites 1.000–100.000). Implementa el contrato de la API, incluyendo 409 ante doble decisión, bloqueo de login y expiración del token a los 10 minutos, para que los revisores ejecuten la UI sin el backend. Se excluye de los builds de producción (ADR-0025).

## Cómo se usa Spec Kit

Este proyecto se desarrolla con [GitHub Spec Kit](https://github.com/github/spec-kit), con asistencia de IA.

| Fase | Comando | Artefacto | Estado |
|---|---|---|---|
| 0 | Análisis manual | docs/00-analisis.es.md | Hecho |
| 1 | /speckit.constitution | .specify/memory/constitution.md | Pendiente |
| 2 | /speckit.specify | specs/001-web-ui/spec.md | Pendiente |
| 3 | /speckit.clarify | spec.md (Clarifications) | Pendiente |
| 4 | /speckit.plan | plan.md, contracts/ | Pendiente |
| 5 | /speckit.tasks | tasks.md | Pendiente |
| 6 | /speckit.analyze | docs/speckit-log.md | Pendiente |
| 7 | /speckit.implement | código | Pendiente |

## Documentación
- Prompts de Spec Kit por fase: [docs/speckit-log.md](docs/speckit-log.md)
- Análisis: [docs/00-analisis.es.md](docs/00-analisis.es.md)
- Decisiones (índice de ADR): [docs/decisions/README.md](docs/decisions/README.md)
- Planificación: [CONTEXT](docs/planning/CONTEXT.md) · [tareas frontend](docs/planning/tasks-frontend.md) · [tareas repos/CI/CD](docs/planning/tasks-devops.md)
- Repo complementario: `cbl-backend`.
