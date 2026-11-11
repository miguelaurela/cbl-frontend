# Architecture Decision Records (ADR) – Frontend | Registro de decisiones – Frontend

Each ADR is one bilingual file: English section first, then `## Español`. Numbering is shared with `cbl-backend`.
Cada ADR es un único archivo bilingüe: sección en inglés y luego `## Español`. La numeración es compartida con `cbl-backend`.

| ADR | Decision | Decisión |
|---|---|---|
| [0001](0001-dotnet-angular.md) | .NET + Angular | .NET + Angular |
| [0002](0002-two-repositories.md) | Two repositories | Dos repositorios |
| [0012](0012-ngrx.md) | State with NgRx | Estado con NgRx |
| [0013](0013-token-in-memory.md) | Token only in memory (10-minute expiry) | Token solo en memoria (expira a los 10 minutos) |
| [0020](0020-guards-interceptors-forms.md) | Guards, interceptors and Reactive Forms | Guards, interceptores y Reactive Forms |
| [0025](0025-frontend-ui-defaults.md) | Frontend UI defaults | Valores por defecto de la UI |
| [0027](0027-mock-by-file-replacement.md) | Mock excluded from production by file replacement | Mock excluido de producción por sustitución de archivos |
| [0028](0028-session-logout-and-return-url.md) | Session timer, server-side logout and validated returnUrl | Temporizador de sesión, cierre en el servidor y returnUrl validado |
| [0029](0029-types-generated-from-openapi.md) | API types generated from the backend OpenAPI | Tipos de la API generados desde el OpenAPI del backend |
| [0030](0030-runtime-config.md) | API URL read at run time from config.json | URL de la API leída en tiempo de ejecución desde config.json |

## Backend ADRs (in `cbl-backend`, `docs/decisions/`) | ADR del backend

| ADR | Topic | Tema |
|---|---|---|
| 0003 | Clean architecture, 4 projects | Arquitectura limpia, 4 proyectos |
| 0004 | Light CQRS without MediatR | CQRS ligero sin MediatR |
| 0005 | `.sqlproj` as source of truth | `.sqlproj` como fuente de verdad |
| 0006 | Database strategy (InMemory locally, SQL Server in CI) | Estrategia de BD |
| 0007 | Optimistic concurrency (409) | Concurrencia optimista (409) |
| 0008 | Amount limits in the database | Límites de monto en BD |
| 0009 | Short-lived JWT (10 minutes), no refresh token | JWT de vida corta (10 minutos), sin refresh token |
| 0010 | Middleware security | Seguridad por middleware |
| 0011 | Read-side cache | Caché en lectura |
| 0014 | Integration tests | Pruebas de integración |
| 0015 | Term in months, immutable decisions | Plazo en meses, decisiones inmutables |
| 0016 | CI pipeline | Pipeline de CI |
| 0017 | User management by the admin | Gestión de usuarios por el administrador |
| 0018 | Password hashing and login protection | Hash de contraseñas y protección del login |
| 0019 | Spec Kit versioned in the repo | Spec Kit versionado en el repo |
| 0021–0024 | See the backend index | Ver el índice del backend |

If you change a decision, create a new ADR and mark the old one "Superseded by ADR-00XX".
Si cambias una decisión, crea un ADR nuevo y marca el anterior como "Reemplazada por ADR-00XX".
