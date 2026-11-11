# CBL Frontend – Task breakdown (Angular 19, `cbl-frontend`)

_Resumen: desglose de tareas del frontend (Angular 19 + Material + NgRx), ordenado, con MVP marcado, mock de API para avanzar sin backend y el contrato de API asumido para reconciliar con el backend._

Sources: `/home/claude/planning/CONTEXT.md`, `loans-frontend/docs/00-analisis.md`, ADR-0012 (NgRx), ADR-0013 (token in memory), ADR-0020 (guards/interceptors/forms), backend ADRs 0007, 0008, 0015, 0017, 0018.
Where old docs conflict with CONTEXT.md, CONTEXT.md wins: roles are `Admin` and `Borrower`; JWT lifetime is **10 minutes**; names are "CBL", not "Loans".

Conventions: `[P]` = can run in parallel with its siblings once its dependencies are done. Size: S (< 30 min), M (30-90 min), L (> 90 min). Unit tests are written together with the code they cover (the test tasks in Phase 6 are the checklist, not a separate step).

---

## MVP cut line (Linea de corte del MVP)

| Delivery | Phases | What the reviewer sees |
|---|---|---|
| **MVP (must ship)** | 0, 1, 2, 3, 4, 6 (core tests), 7 (FE-70, FE-71, FE-73) | Login, Borrower (request + my loans), Admin (all loans, approve/reject), guards, interceptors, ProblemDetails handling, runs on mock, tests green, CI + build artifact |
| **After the cut (if time allows)** | 5 | Admin users management, loan-limit editor, role-aware navigation |
| **Nice-to-have** | 7 (FE-74, FE-72 extras) | OpenAPI-generated types, bundle checks |

Rule: do not start Phase 5 until the MVP checklist at the bottom is fully green.

---

## Phase 0 - Scaffold and theme (Andamiaje y tema)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-01 | Create the app: `ng new cbl-frontend --standalone --routing --style=scss --ssr=false`, strict TS. Add `@angular/material`, `@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools` (devtools only in dev). Tests stay on Karma/Jasmine (Angular default). | - | S | `ng build` and `ng test --watch=false --browsers=ChromeHeadless` pass on the empty app |
| FE-02 | Folder layout and configs: `src/app/{core,features,shared,store}`; `environments` with `apiBaseUrl`, `useMockApi`, `currencyCode`, `locale`; Angular build configurations `development`, `mock` (useMockApi=true) and `production`. npm scripts: `start` (real API), `start:mock`, `test`, `build`. | FE-01 | S | `npm run start:mock` serves the app; `npm run build` produces `dist/` |
| FE-03 | [P] Angular Material M3 theme (`mat.theme`, light, one primary + tertiary, Roboto + Material Icons), global SCSS tokens (spacing, container max width), `provideAnimationsAsync`. | FE-01 | S | A sample button/card/table render themed; no default purple-baseline look |
| FE-04 | [P] App shell: `AppComponent` with toolbar (app name "CBL", user email + role chip, Logout button shown only when authenticated), `router-outlet`, responsive (toolbar collapses to icon buttons below 600 px). | FE-03 | M | Shell renders at 360/768/1280 px without horizontal scroll |
| FE-05 | [P] Spec Kit in repo: `.specify/` and `specs/` committed; start `docs/speckit-log.md` entries for constitution/specify/clarify/plan (spec = stories 1-5 and 7, plus users/limits as optional). | FE-01 | S | Files versioned; log has date + prompt per phase |

## Phase 1 - Contract and mock API (Contrato y API simulada)

Goal: the whole UI can be built and demoed with **no backend**. Chosen approach: an in-memory **HTTP interceptor mock** (not json-server) because approve/reject, 409 on double decision, lockout and token expiry need real logic and json-server cannot express them. It is only wired when `useMockApi` is true and is excluded from the production build.

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-10 | Models in `core/models`: `Role`, `LoanStatus`, `Loan`, `User`, `LoginRequest/Response`, `CreateLoanRequest`, `DecideLoanRequest`, `LoanLimits`, `CreateUserRequest`, `UpdateUserRequest`, `ProblemDetails` exactly as in "Assumed API contract". | FE-02 | S | Compiles; every API method signature uses these types, no `any` |
| FE-11 | [P] API services in `core/api`: `AuthApi`, `LoansApi`, `UsersApi`, `ParametersApi` (thin `HttpClient` wrappers). `API_BASE_URL` injection token fed from the environment. | FE-10 | S | Each service has one method per contract endpoint; URLs match the contract table |
| FE-12 | `MockApiInterceptor` (functional) with in-memory DB seeded like the backend (`usuario@test.com`, `admin@test.com`, password `123`; limits 1,000-100,000; a few loans in all three statuses). Implements every endpoint of the contract, 300-600 ms latency, returns RFC 7807 bodies with `errors` for validation. | FE-10 | L | All contract endpoints answer in mock mode |
| FE-13 | Mock rules fidelity: amount within limits, term 1-60, only `Pending` can be decided, second decision on the same loan -> 409, Borrower sees only own loans (403 on admin routes), email uniqueness -> 409 on user create, 5 failed logins -> lockout response for 15 min. Magic input `fail500@test.com` forces a 500 on login to exercise the error state. | FE-12 | M | Manually or by unit test: each rule returns the status code documented in the contract |
| FE-14 | Mock tokens: unsigned JWT-shaped string (`header.payload.sig`) with `sub`, `email`, `role`, `exp` = now + 10 min, so expiry logic is exercised for real. Interceptor validates it on every call and answers 401 when expired/missing. | FE-12 | S | In mock mode, a token older than 10 min yields 401 |
| FE-15 | Wiring: in `app.config.ts`, register the mock interceptor **last** in the chain, only if `environment.useMockApi` (so auth/error interceptors still run). Production config never imports the mock file. | FE-12 | S | `ng build --configuration production` bundle contains no mock code (grep for a mock-only string) |

## Phase 2 - Core: auth, interceptors, guards, errors (Nucleo)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-20 | `ProblemDetails` handling util `core/errors/problem.ts`: `toAppError(httpError)` -> `{status, title, detail, fieldErrors: Record<string,string[]>, traceId?}`. Field keys normalised to camelCase. Network failure (status 0) -> "cannot reach the server"; non-JSON bodies -> generic message by status. | FE-10 | S | Unit tests: 400 with `errors`, 401, 409, 422, 500, status 0, non-ProblemDetails body |
| FE-21 | Auth store (`store/auth`): state `{token, user, expiresAt, status: idle/loading/authenticated/failed, error}`; actions `login`, `loginSuccess`, `loginFailure`, `logout`, `sessionExpired`; selectors `selectToken`, `selectUser`, `selectRole`, `selectIsAuthenticated`, `selectAuthLoading`, `selectAuthError`. Token only in the store, **never** in local/sessionStorage. | FE-11, FE-20 | M | Reducer and selector specs pass; grep finds no `localStorage`/`sessionStorage` in `src/` |
| FE-22 | Auth effects: `login$` (API call, map errors via `toAppError`), `loginSuccess$` (navigate by role: Admin -> `/admin/loans`, Borrower -> `/loans`), `logout$` (navigate `/login`), `expiry$` (on `loginSuccess` start a timer to `expiresAt`, then dispatch `sessionExpired`; cancelled by `logout`). `sessionExpired` shows "Session expired, please sign in again" on the login screen. | FE-21 | M | Effect specs with `fakeAsync`: redirect per role, auto-logout after 10 min, timer cancelled on manual logout |
| FE-23 | `authInterceptor` (functional): adds `Authorization: Bearer` **only** to requests whose URL starts with `API_BASE_URL` and only when a token exists. | FE-21 | S | Spec: header present for API URL, absent for other origins and for no-token |
| FE-24 | `errorInterceptor` (functional): on 401 from any request except the login call -> dispatch `sessionExpired`; on 403 -> notify "You do not have permission"; always rethrows the error so effects can map it. | FE-21, FE-25 | S | Spec: 401 on `/loans` dispatches `sessionExpired`; 401 on `/auth/login` does not; 403 notifies |
| FE-25 | [P] `NotificationService` (MatSnackBar wrapper: success/error/info, 4 s, polite aria-live). | FE-03 | S | Service spec; used by effects |
| FE-26 | Guards (`core/guards`): `authGuard` (token present and `expiresAt` in the future, else `UrlTree` to `/login`), `roleGuard(role)` factory exposed as `adminGuard` / `borrowerGuard` (wrong role -> redirect to own home, or `/forbidden`), `guestGuard` for `/login` (already authenticated -> own home). Backend still re-validates. | FE-21 | M | Guard specs: anonymous, expired, Borrower on admin route, Admin on borrower route, authenticated on `/login` |
| FE-27 | Routing (`app.routes.ts`): `/login`, `/loans` (authGuard + borrowerGuard), `/admin/loans`, `/admin/users`, `/admin/limits` (authGuard + adminGuard), `/forbidden`, `**` -> `/login`. All lazy (`loadComponent`); feature state registered with `provideState`/`provideEffects` in route `providers`. | FE-26 | S | Navigating by URL respects every guard; unknown URL redirects |
| FE-28 | [P] Shared state components: `StateView` wrapper (inputs `loading`, `error`, `empty`, `emptyMessage`; outputs `retry`) showing spinner / error card with Retry / empty illustration + text, else projected content. `StatusChip` (Pending/Approved/Rejected with colour **and** icon/text, not colour alone). `ConfirmDialog`. | FE-03 | M | Component specs for each state; chips readable in light theme and with colour-blind simulation |
| FE-29 | [P] Form helpers: `applyServerErrors(form, fieldErrors)` (sets a `server` error on matching controls, clears it on value change), `errorMessage(control, labels)` mapping error keys to human text, `<app-field-error>` or equivalent. | FE-20 | S | Spec: server `amount` error appears on the amount control and disappears after edit |

## Phase 3 - Login and Borrower (Login y vista Prestamista)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-30 | Login page `/login`: Reactive Form (email required + email format, password required), show/hide password, submit disabled while loading, spinner on button. Error banner mapped from `ProblemDetails`: 401 generic "Invalid credentials" (never says which field), lockout/429 shows the server message (and retry time if provided), network/500 generic. Shows the "session expired" notice. Shows demo credentials hint **only** when `useMockApi`. | FE-22, FE-29 | M | Logging in as `usuario@test.com` / `admin@test.com` (mock) lands on the right home; wrong password shows generic message; 5 failures show lockout message |
| FE-31 | Parameters store (`store/parameters`): `loadLimits`, success/failure, selectors `selectLimits`, `selectLimitsStatus`. Loaded when the Borrower page opens (and after login). Read-only in MVP. | FE-11, FE-21 | S | Reducer/selector/effect specs |
| FE-32 | Validators (`shared/validators`): constants `TERM_MIN=1`, `TERM_MAX=60`; `termMonths` = required + integer + range; `amount` = required + positive + max 2 decimals + `amountWithinLimits(limits)` (reads current limits, re-validates when they arrive); same rule set reused by users/limits forms where applicable. Backend remains source of truth. | FE-10 | M | Specs: 0, 61, 1.5, empty, min-1, max+1 and boundary values 1 and 60, limits boundary values |
| FE-33 | Loans store (`store/loans`): state `{items, loadStatus, submitStatus, decidingIds, error}`; actions `loadMine`, `loadAll({status?})`, `create`, `decide({id, decision, version})` each with success/failure; selectors `selectMyLoans` (sorted newest first), `selectLoansFiltered`, `selectPendingCount`, `selectLoansLoading`, `selectLoansError`, `selectIsDeciding(id)`. | FE-11, FE-20 | M | Reducer and selector specs |
| FE-34 | Loans effects: `loadMine$`, `loadAll$`, `create$` (success: snackbar + dispatch `loadMine`; failure: `fieldErrors` kept in state for the form), `decide$` (success: snackbar + dispatch `loadAll` with current filter so the list is refreshed **from the API**; 409: snackbar "Already decided by another admin" + `loadAll`; other errors: snackbar with `detail`). | FE-33, FE-25 | M | Effect specs incl. success, 400 with field errors, 409, 500 |
| FE-35 | Borrower page `/loans`: **Request form** (amount, term in months, hint "Between {min} and {max}" from limits, submit disabled when invalid or submitting, server field errors via `applyServerErrors`, form reset on success) + **My loans** list (amount via currency pipe, term, status chip, requested date, decision date). Table >= 768 px, stacked cards below. `StateView` for loading / error+retry / empty ("You have no loan requests yet"). | FE-31, FE-32, FE-34, FE-28 | L | Valid request appears in the list as Pending; out-of-range amount blocked client-side; server 400/422 shown under the field; empty/loading/error states visible (force via mock) |

## Phase 4 - Admin loans (Admin: todos los prestamos)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-40 | Admin loans page `/admin/loans`: table with borrower name/email, amount, term, status chip, requested at, decided by/at; `mat-button-toggle` filter All / Pending / Approved / Rejected (default Pending) with pending badge count; newest first. Cards layout below 768 px. `StateView` for loading/error/empty ("No loans match this filter"). No pagination in MVP (list is small). | FE-34, FE-28 | L | Filter changes the list; Borrower accounts cannot open the route |
| FE-41 | Approve / Reject actions: buttons only on `Pending` rows; `ConfirmDialog` showing borrower, amount, term; per-row spinner (`selectIsDeciding`) and disabled buttons while in flight; on success the list reloads from the API and the row shows the decision and decider; on 409 the row refreshes and the snackbar explains. | FE-40 | M | Approve one and reject another in mock mode; deciding twice (use two tabs or mock 409 trigger) shows the 409 message and a refreshed row |

## Phase 5 - After MVP: users and limits (Usuarios y limites; opcional)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-50 | Users store (`store/users`): `loadUsers`, `createUser`, `updateUser` with success/failure, selectors, effects (reload list after save; 409 duplicate email -> field error on `email`). | FE-11, FE-20 | M | Reducer/selector/effect specs |
| FE-51 | Users page `/admin/users`: table (name, email, role chip, active badge), "New user" and "Edit" open a dialog with Reactive Form: email (required, email), full name (required, max 100), role (`Admin`/`Borrower`), password (required on create, min 8 - mirror backend policy; optional on edit), active toggle. Own row cannot be deactivated (disabled with tooltip). Loading/error/empty states, responsive cards. | FE-50, FE-28, FE-29 | L | Create, edit, deactivate a user in mock mode; duplicate email shows field error; deactivated user cannot log in (mock) |
| FE-52 | Loan limits page `/admin/limits`: form `minAmount`, `maxAmount` with cross-field validator (min > 0, max > min), loads current values, saves, success snackbar, server errors by field; note "Applies to new requests only". Reuses `parameters` store (adds `saveLimits`). | FE-31, FE-29 | M | Changing limits in mock mode changes the validation hint and the accepted range in the Borrower form |
| FE-53 | Role-aware navigation in the shell: Borrower sees "My loans"; Admin sees "Loans", "Users", "Limits". | FE-51, FE-52 | S | Links shown per role; deep links still guarded |

## Phase 6 - Unit tests checklist (Pruebas unitarias)

Written alongside the code; this phase is the "definition of done" for the PDF requirement. Use `provideMockStore`, `provideMockActions`, `HttpTestingController`, `fakeAsync`.

| ID | Task | Covers | Acceptance check |
|---|---|---|---|
| FE-60 | [P] Reducer specs | auth, loans, parameters (+ users in Phase 5): initial state, each action, error and loading transitions | All pass |
| FE-61 | [P] Selector specs | auth (`selectIsAuthenticated`, `selectRole`), loans (sorting, filter, pending count, `selectIsDeciding`), parameters | All pass |
| FE-62 | [P] Effect specs | auth (login ok/401/lockout, role redirect, expiry timer, logout cancels timer), loans (create ok/400, decide ok/409, reload after decision), parameters | All pass |
| FE-63 | [P] Guard specs | `authGuard`, `adminGuard`, `borrowerGuard`, `guestGuard` (see FE-26 cases) | All pass |
| FE-64 | [P] Interceptor specs | `authInterceptor` (API origin only), `errorInterceptor` (401 except login, 403, rethrow) | All pass |
| FE-65 | [P] Validator and util specs | amount/term validators, `toAppError`, `applyServerErrors` | All pass |
| FE-66 | [P] Light component smoke specs | Login, Borrower page, Admin loans page: render loading/empty/error/data with `MockStore`; form invalid blocks submit; approve button only on Pending | All pass; `ng test` green in CI |

## Phase 7 - Polish and delivery (Pulido y entrega)

| ID | Task | Deps | Size | Acceptance check |
|---|---|---|---|---|
| FE-70 | Responsive and a11y pass: check 360 / 768 / 1280 px on all MVP screens; labels on every input, `aria-live` on banners/snackbars, visible focus, keyboard-operable dialogs, status never by colour alone. | MVP screens | M | No horizontal scroll; Lighthouse accessibility >= 90 on login and loans pages |
| FE-71 | GitHub Actions `.github/workflows/frontend.yml`: `npm ci`, headless tests, `ng build --configuration production`, upload `dist/` as artifact; on version tag attach a zip to the GitHub Release. **Artifacts only, no cloud deploy.** | FE-66 | S | Green run on a PR; artifact downloadable |
| FE-72 | Hardening checks: no `localStorage`/`sessionStorage`/`innerHTML`/`bypassSecurityTrust*` in `src/`; production bundle has no mock code; no secrets in environments. Add as a CI grep step. | FE-15, FE-71 | S | CI step fails if any pattern appears |
| FE-73 | Docs (bilingual EN/ES): README (run with mock, run against real API, env config, tests, structure, session behaviour: token in memory, 10-min expiry, refresh loses session), finish `docs/speckit-log.md`, ADRs: mock-by-interceptor, session expiry timer, validators mirror backend. | MVP | M | A reviewer can run `npm ci && npm run start:mock` from the README alone |
| FE-74 | Contract reconciliation (when the backend OpenAPI/route table exists): diff against "Assumed API contract", fix models/services/mock; optionally generate types with `openapi-typescript`. | Backend route table | M | Mock and real API produce the same shapes; frontend runs against the real API (`npm start`) end to end |

---

## Dependency summary

```
FE-01 -> FE-02 -> FE-10 -> FE-11/FE-12 -> FE-13/14/15
FE-01 -> FE-03 -> FE-04, FE-25, FE-28
FE-10 -> FE-20 -> FE-21 -> FE-22/23/24/26 -> FE-27
FE-30 (login) needs FE-22 + FE-29
FE-31/32/33 -> FE-34 -> FE-35 (borrower)  and  FE-40 -> FE-41 (admin)
Phase 6 tests follow each unit; Phase 5 only after MVP checklist
```

Suggested order for one person: FE-01, 02, 03, 10, 11, 12-15, 20-29, 30, 31-35, 40-41, tests (60-66), 70, 71, 73, then Phase 5.

## MVP definition of done

- [ ] `npm run start:mock`: login as both seeded users, each lands on the right screen
- [ ] Borrower: request a loan (client + server validation) and see it in "My loans"
- [ ] Admin: see all loans, filter, approve and reject with confirmation, list refreshes from the API, 409 handled
- [ ] Anonymous or wrong-role access redirects; session expires after 10 min and returns to login with a message
- [ ] Loading, error and empty states on every list; layout works at 360 px
- [ ] Reducers, selectors, effects, guards, interceptors have specs; CI green; production build artifact produced
- [ ] README (EN/ES) and Spec Kit log updated

---

## Assumed API contract (Contrato de API asumido)

_Resumen: endpoints y DTOs que el frontend asume; el agente del backend debe contrastarlos con su tabla de rutas (FE-74)._

General conventions assumed:
- Base path `/api` (configurable via `apiBaseUrl`); JSON **camelCase**; dates ISO 8601 UTC strings; money as JSON number (decimal, 2 places); enums serialized as **strings** (`JsonStringEnumConverter`); ids are **strings (GUID)** - the frontend treats them as opaque.
- Auth: `Authorization: Bearer <jwt>`; the user id always comes from the token, never from the client. JWT lifetime 10 min, no refresh.
- Errors: RFC 7807 `ProblemDetails` (`application/problem+json`) for every non-2xx, with `type`, `title`, `status`, `detail`, `traceId` and, for validation, `errors: { fieldName: string[] }` (field names camelCase, matching request DTO properties).

### Endpoints

| Method + path | Role | Request | Success | Errors the UI handles |
|---|---|---|---|---|
| `POST /api/auth/login` | anonymous | `LoginRequest` | 200 `LoginResponse` | 400 validation; 401 generic invalid credentials; **423** locked after repeated failures (alt. 429 with `Retry-After`) |
| `GET /api/loans/mine` | Borrower | - | 200 `Loan[]` (own only) | 401, 403 |
| `POST /api/loans` | Borrower | `CreateLoanRequest` | 201 `Loan` (+ `Location`) | 400/422 with `errors.amount` / `errors.termMonths`; 401; 403 |
| `GET /api/loans?status=Pending\|Approved\|Rejected` | Admin | `status` optional | 200 `Loan[]` (all users, no paging) | 401, 403 |
| `GET /api/loans/{id}` | Admin or owner | - | 200 `Loan` | 401, 403, 404 (not used by the MVP UI) |
| `POST /api/loans/{id}/approve` | Admin | `DecideLoanRequest` | 200 `Loan` (updated) | 401, 403, 404, **409** already decided / concurrent update |
| `POST /api/loans/{id}/reject` | Admin | `DecideLoanRequest` | 200 `Loan` (updated) | same as approve |
| `PUT /api/loans/{id}` / `DELETE /api/loans/{id}` | owner (Pending only) / Admin | `CreateLoanRequest` | 200 `Loan` / 204 | **Not used by the UI** (PDF's CRUD lives in the API; listed only so the route table can be reconciled) |
| `GET /api/parameters/loan-limits` | any authenticated | - | 200 `LoanLimits` | 401 |
| `PUT /api/parameters/loan-limits` | Admin | `LoanLimits` | 200 `LoanLimits` | 400/422 (`minAmount`, `maxAmount`), 401, 403 |
| `GET /api/users` | Admin | - | 200 `User[]` | 401, 403 |
| `POST /api/users` | Admin | `CreateUserRequest` | 201 `User` | 400/422 per field; **409** email already exists |
| `PUT /api/users/{id}` | Admin | `UpdateUserRequest` | 200 `User` | 400/422, 404, 409, 403 (e.g. deactivating self) |

Deactivation is logical (`isActive=false` through `PUT`); the UI never calls `DELETE /api/users/{id}`. A deactivated user cannot log in (401 generic).

### DTOs (TypeScript shapes used by `core/models`)

```ts
type Role = 'Admin' | 'Borrower';
type LoanStatus = 'Pending' | 'Approved' | 'Rejected';

interface LoginRequest  { email: string; password: string }
interface LoginResponse {
  accessToken: string;          // JWT, claims: sub, email, role, exp
  tokenType: 'Bearer';
  expiresAt: string;            // ISO UTC, = exp claim (10 min); UI timer uses this
  user: { id: string; email: string; fullName: string; role: Role };
}

interface Loan {
  id: string;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail: string;
  amount: number;
  termMonths: number;           // 1..60
  status: LoanStatus;
  createdAt: string;
  decidedAt: string | null;
  decidedById: string | null;
  decidedByName: string | null;
  version: number;              // optimistic concurrency token
}
interface CreateLoanRequest  { amount: number; termMonths: number }
interface DecideLoanRequest  { version: number }   // sent back to detect concurrent decisions; backend may also accept an empty body

interface LoanLimits { minAmount: number; maxAmount: number }   // seed 1000 / 100000

interface User {
  id: string; email: string; fullName: string;
  role: Role; isActive: boolean; createdAt: string;
}
interface CreateUserRequest { email: string; fullName: string; password: string; role: Role }
interface UpdateUserRequest { fullName: string; role: Role; isActive: boolean; password?: string }

interface ProblemDetails {
  type?: string; title: string; status: number; detail?: string;
  instance?: string; traceId?: string;
  errors?: Record<string, string[]>;
}
```

### Points the backend route table must confirm (reconciliation checklist)

1. Route names and the `/api` prefix; `mine` vs a query filter on `GET /api/loans`.
2. Id type (GUID string vs integer) and enum serialization as strings.
3. Whether decisions need `version` in the body (or `If-Match`), and that a second decision always yields 409.
4. Login lockout status code (423 vs 429) and whether `Retry-After` is sent.
5. `expiresAt` present in `LoginResponse` (otherwise the UI decodes `exp` from the JWT).
6. Validation status for bad input: 400 vs 422 (the UI accepts both) and camelCase keys in `errors`.
7. Location of loan limits (`/api/parameters/loan-limits` assumed) and that it is readable by Borrowers.
8. Password policy for user creation (UI assumes min 8 characters).
9. CORS allows the frontend origin and the `Authorization` header.

---

## Open questions for the user

1. **Currency and number format** for amounts (the PDF does not say). Default: show `USD` with `en-US` formatting, configurable in `environment` (`currencyCode`, `locale`) so it is a one-line change.
2. **UI language**: Spanish or English text in the screens? Default: Spanish UI labels (e.g. "Prestamista") kept in one `labels.ts` constants file, no i18n library; code and identifiers stay in English.
3. **Phase 5 (users + limits screens) before or after submission polish?** Default: after the MVP checklist is green, because the PDF only requires three screens; do both screens if there is time since the admin role was decided to include them.
4. **Admin list size**: add server-side pagination or keep a plain list with a status filter? Default: plain list, no pagination (technical-test scale); revisit only if the backend returns paged results.
5. **Mock API in the repo**: keep the interceptor mock as a permanent `mock` configuration for reviewers without the backend? Default: yes, documented in the README and excluded from production builds.
