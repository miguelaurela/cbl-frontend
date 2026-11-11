[English](00-analysis.md) | Español

# Análisis – Frontend (Angular 19)

## Alcance
Interfaz que consume la API del backend. El PDF pide: enviar solicitudes, consultar estado, y que el admin vea y cambie estados; JWT con Guards; estado con servicios o NgRx; Reactive Forms; estilos cuidados.

## Decisiones tomadas
| Tema | Decisión |
|---|---|
| Repositorio | Separado del backend (`cbl-backend`); contrato = OpenAPI del backend (ADR-0002) |
| Estado | NgRx, slices `auth`, `loans`, `users` (ADR-0012) |
| Token | Solo en memoria, vida de 10 minutos, sin refresh token, temporizador de cierre de sesión automático al expirar (ADR-0013, ADR-0009 del backend) |
| Rutas | `authGuard` y `roleGuard` (`adminGuard` / `borrowerGuard`); el backend siempre revalida |
| Interceptores | Uno añade el Bearer; otro cierra sesión ante 401 |
| Formularios | Reactive Forms con validadores que reflejan las reglas del backend (plazo 1–60 meses, monto dentro de los límites que expone la API) |
| UI | Angular Material; estados de carga, error y vacío; responsive; etiquetas en español en `labels.ts` (ADR-0025) |
| Modelos | Tipados a partir del OpenAPI |
| Roles | Exactamente dos: `Admin` y `Borrower` (en español: Prestamista) |
| Desarrollo sin backend | Configuración de build `mock` permanente (ADR-0025) |

## Estructura propuesta
```
src/app/
  core/      auth, api, interceptores, guards, modelos, errores
  features/  loans (prestamista), admin
  shared/    componentes y utilidades
  store/     auth, loans, users (acciones, reducers, efectos, selectores)
```

## Historias de usuario aplicables
Del backend: 1 (login), 2 (solicitar), 3 (ver mis préstamos), 4 (admin ve solicitudes), 5 (aprobar/rechazar) y 7 (cerrar sesión), más la pantalla de gestión de usuarios del admin (historia 6). Orden de trabajo: el MVP son las fases 0–4 de `docs/planning/tasks-frontend.md`; las pantallas de usuarios y de límites van cuando el checklist del MVP esté en verde (ADR-0025).

## Criterios clave
- Sin sesión o sin rol Admin, las rutas de administrador redirigen.
- Tras aprobar o rechazar, la lista se actualiza desde la API.
- Errores `ProblemDetails` (400/401/403/409/422) se muestran por campo o como mensaje claro.
- La sesión expira a los 10 minutos (cierre automático) y se pierde al refrescar la página (comportamiento esperado).

## Riesgos
- Token solo en memoria: peor experiencia al refrescar, más seguro frente a XSS.
- Dependencia del contrato del backend: trabajar con el mock hasta que la API exista (el PDF lo permite).
