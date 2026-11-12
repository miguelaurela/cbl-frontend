English | [Español](README.es.md)

# CBL Frontend – Control Banking Loans (Angular)

Angular client for the Makers technical test, part of **CBL Project (Control Banking Loans)**. It consumes the API of `cbl-backend` (.NET).

> **For reviewers:** the **theory part** is in the backend README: [Theory part](https://github.com/miguelaurela/cbl-backend#theory-part) (question 5 is about this frontend).

## Stack
Angular 19 (standalone components) · Angular Material · NgRx (`auth`, `loans`, `users`) · Reactive Forms · HTTP interceptors and route guards · TypeScript (strict) · Karma + Jasmine

## Screens (PDF reference)
1. **Login**: email and password with validation; generic message for wrong credentials; lockout and rate-limit messages with the wait time.
2. **Borrower** (Prestamista): form to request a loan (amount and term) with the current limits as help, and a "My loans" list with status.
3. **Admin**: all requests with a status filter (Pending by default), the pending count, a manual "Actualizar" button, and Approve / Reject with a confirmation dialog. **Users** (admin): list, create, edit, deactivate and reactivate users in a dialog (an admin cannot deactivate their own account or change their own role). **Loan limits** (admin): view and change the minimum and maximum amount; the change applies only to new requests.

Sample credentials (demo only): `usuario@test.com` / `123` (Borrower) and `admin@test.com` / `123` (Admin).

## Session behaviour
The JWT lives **only in memory** (NgRx): it is never written to `localStorage`, `sessionStorage` or cookies. It lasts 10 minutes, there is no refresh token, and a timer closes the session when it expires. **Reloading the page loses the session** (this is expected). "Cerrar sesión" calls `POST /api/auth/logout` to revoke the token on the server and always clears the local session. After signing in you return to the screen you asked for (validated against open redirects).

## How to run

Requirements: Node.js 18.19.1 or later (CI and `.nvmrc`: 22 LTS), npm 10 and Chrome for the tests.

```
npm ci
npm run start:mock   # http://localhost:4200, no backend needed (demo mode with sample data)
npm start            # http://localhost:4200, against the real API
```

The API base URL is read at run time from [`public/config.json`](public/config.json) (`apiBaseUrl`, default `http://localhost:5000`), so the same build works with any API. The backend allows the origin `http://localhost:4200` by default.

### Scripts

| Script | What it does |
|---|---|
| `npm run lint` | ESLint (bans `localStorage`, `sessionStorage`, `innerHTML` and `bypassSecurityTrust*`) |
| `npm test` | Unit tests (Karma + Jasmine, headless Chrome, no watch) |
| `npm run build` / `build:mock` | Production build / demo build (`dist/cbl-web`, `dist/cbl-web-mock`) |
| `npm run contract:generate` / `contract:check` | Generate the API types from `specs/001-web-ui/contracts/openapi.yaml` / fail if they are outdated |
| `npm run contract:check-mock` | Fail if the mock does not implement an operation of the contract that the UI uses |
| `npm run contract:sync` | Warn if the contract copy differs from `cbl-backend@main` |
| `npm run check:hardening` | Fail if `src/` uses browser storage or unsanitized HTML |
| `npm run check:prod` | Production build and fail if it contains mock code |

## Mock API (demo mode)
The repo keeps a permanent `mock` build configuration: an HTTP interceptor with in-memory data seeded like the backend (the sample users above, limits 1,000–100,000, and loans in the three states). It reproduces the server behaviour: the same validations and messages, 403 by role, 409 on double decisions or stale versions, login lockout after 5 failures for 15 minutes (423 with `Retry-After`), logout that revokes the token and 10-minute token expiry. A banner states that the data is sample data and is lost on reload. Entering `fail500@test.com` at login forces a 500 error.

The mock is **excluded from production builds** by file replacement in `angular.json` (the `mock` configuration replaces `mock-api.providers.ts`); `npm run check:prod` verifies it (ADR-0025).

## How Spec Kit is used

This project is developed with [GitHub Spec Kit](https://github.com/github/spec-kit), with AI assistance.

| Phase | Command | Artifact | Status |
|---|---|---|---|
| 0 | Manual analysis | docs/00-analysis.md | Done |
| 1 | /speckit.constitution | .specify/memory/constitution.md | Done |
| 2 | /speckit.specify | specs/001-web-ui/spec.md | Done |
| 3 | /speckit.clarify | spec.md (Clarifications) | Done |
| 4 | /speckit.plan | plan.md, contracts/ | Done |
| 5 | /speckit.tasks | tasks.md | Done |
| 6 | /speckit.analyze | docs/speckit-log.md | Done |
| 7 | /speckit.implement | code | Done: 96/96 tasks; CI green; validated against the mock and the real backend ([quickstart results](specs/001-web-ui/quickstart-results.md), [security review](specs/001-web-ui/security-review.md)) |

## Documentation
- Spec Kit prompts per phase: [docs/speckit-log.md](docs/speckit-log.md)
- Specification, plan and tasks: [specs/001-web-ui](specs/001-web-ui)
- Analysis: [docs/00-analysis.md](docs/00-analysis.md)
- Decisions (ADR index): [docs/decisions/README.md](docs/decisions/README.md)
- Planning: [CONTEXT](docs/planning/CONTEXT.md) · [frontend tasks](docs/planning/tasks-frontend.md) · [repo/CI/CD tasks](docs/planning/tasks-devops.md)
- Companion repo: `cbl-backend`.
