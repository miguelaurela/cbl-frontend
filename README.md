English | [Español](README.es.md)

# CBL Frontend – Control Banking Loans (Angular)

Angular client for the Makers technical test, part of **CBL Project (Control Banking Loans)**. It consumes the API of `cbl-backend` (.NET).

## Stack
Angular 19 (standalone components) · Angular Material · NgRx (`auth`, `loans`, `users`) · Reactive Forms · HTTP interceptors and route guards

## Screens (PDF reference)
1. **Login**: email and password with validation.
2. **Borrower** (Prestamista): form to request a loan (amount and term) and a "My loans" list with status.
3. **Admin**: list of requests with Approve and Reject on pending ones; users management and loan limits follow after the MVP.

Sample credentials: `usuario@test.com` / `123` (Borrower) and `admin@test.com` / `123` (Admin). The session token lives only in memory and expires after 10 minutes.

> Current status: analysis and planning done. The code will be generated with `/speckit.implement`.

## How to run

TODO until the app is implemented. Planned:

```
npm ci
npm run start:mock   # serves the app with the `mock` configuration (no backend needed)
npm start            # serves the app against the real API (apiBaseUrl)
```

The API base URL and the real-API configuration will be documented here once the app exists.

## Mock API
The repo keeps a permanent `mock` build configuration: an HTTP interceptor with in-memory data seeded like the backend (the sample users above, limits 1,000–100,000). It implements the API contract, including 409 on double decisions, login lockout and 10-minute token expiry, so reviewers can run the UI without the backend. It is excluded from production builds (ADR-0025).

## How Spec Kit is used

This project is developed with [GitHub Spec Kit](https://github.com/github/spec-kit), with AI assistance.

| Phase | Command | Artifact | Status |
|---|---|---|---|
| 0 | Manual analysis | docs/00-analysis.md | Done |
| 1 | /speckit.constitution | .specify/memory/constitution.md | Pending |
| 2 | /speckit.specify | specs/001-web-ui/spec.md | Pending |
| 3 | /speckit.clarify | spec.md (Clarifications) | Pending |
| 4 | /speckit.plan | plan.md, contracts/ | Pending |
| 5 | /speckit.tasks | tasks.md | Pending |
| 6 | /speckit.analyze | docs/speckit-log.md | Pending |
| 7 | /speckit.implement | code | Pending |

## Documentation
- Spec Kit prompts per phase: [docs/speckit-log.md](docs/speckit-log.md)
- Analysis: [docs/00-analysis.md](docs/00-analysis.md)
- Decisions (ADR index): [docs/decisions/README.md](docs/decisions/README.md)
- Planning: [CONTEXT](docs/planning/CONTEXT.md) · [frontend tasks](docs/planning/tasks-frontend.md) · [repo/CI/CD tasks](docs/planning/tasks-devops.md)
- Companion repo: `cbl-backend`.
