English | [Español](00-analisis.es.md)

# Analysis – Frontend (Angular 19)

## Scope
UI consuming the backend API. The PDF asks for: submitting loan requests, checking status, and an admin who views and changes statuses; JWT with Guards; state with services or NgRx; Reactive Forms; careful styling.

## Decisions made
| Topic | Decision |
|---|---|
| Repository | Separate from the backend (`cbl-backend`); contract = backend OpenAPI (ADR-0002) |
| State | NgRx, slices `auth`, `loans`, `users` (ADR-0012) |
| Token | Memory only, 10-minute lifetime, no refresh token, auto-logout timer at expiry (ADR-0013, backend ADR-0009) |
| Routes | `authGuard` and `roleGuard` (`adminGuard` / `borrowerGuard`); the backend always re-validates |
| Interceptors | One adds the Bearer header; another logs out on 401 |
| Forms | Reactive Forms with validators mirroring backend rules (term 1–60 months, amount within the limits exposed by the API) |
| UI | Angular Material; loading, error and empty states; responsive; Spanish labels in `labels.ts` (ADR-0025) |
| Models | Typed from the OpenAPI |
| Roles | Exactly two: `Admin` and `Borrower` (Spanish: Prestamista) |
| Development without backend | Permanent `mock` build configuration (ADR-0025) |

## Proposed structure
```
src/app/
  core/      auth, api, interceptors, guards, models, errors
  features/  loans (borrower), admin
  shared/    components and utilities
  store/     auth, loans, users (actions, reducers, effects, selectors)
```

## Applicable user stories
From the backend: 1 (login), 2 (request a loan), 3 (view my loans), 4 (admin views requests), 5 (approve/reject) and 7 (logout), plus the users-management admin screen (story 6). Order of work: the MVP is phases 0–4 of `docs/planning/tasks-frontend.md`; the users and loan-limits screens follow once the MVP checklist is green (ADR-0025).

## Key criteria
- Without a session, or without the Admin role, admin routes redirect.
- After approving or rejecting, the list refreshes from the API.
- `ProblemDetails` errors (400/401/403/409/422) are shown per field or as a clear message.
- The session expires after 10 minutes (automatic logout) and is lost on page refresh (expected behavior).

## Risks
- Token only in memory: worse experience on refresh, safer against XSS.
- Dependency on the backend contract: work against the mock until the API exists (the PDF allows it).
