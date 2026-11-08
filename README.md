# KitchenPulse Frontend

React + TypeScript frontend for the KitchenPulse Spring Boot backend (multi-branch restaurant ingredient supply).
It talks to the **existing, unmodified** backend through real REST APIs and JWT authentication.

```
KitchenPulse/
├── kitchenpulse/              # existing Spring Boot backend (not touched)
└── kitchenpulse-frontend/     # this project
```

## What is built

Everything below is wired to real backend endpoints (verified against the backend source):

| Area | Pages | Backend endpoints |
|---|---|---|
| Authentication | Login, profile, change password | `POST /api/auth/login`, `GET /api/users/me`, `POST /api/users/me/password` |
| Dashboard | One route, four role-specific dashboards | counts and recent items from branches, users, ingredients, units |
| Branches | List (search, filter, paging), details, create, edit, activate/deactivate | `/api/branches*` |
| Ingredient catalog | List (server-side search, filter, sort, paging), details, create, rename, activate/deactivate | `/api/ingredients*`, `/api/units` |
| Units | List, create | `GET/POST /api/units` |
| Users (ADMIN) | List (search, filters, paging), details, create, edit, activate/deactivate, reset password | `/api/users*` |

**Placeholders only** (sidebar entries marked *Soon*, pages say "Coming Soon – Backend Integration Pending"):
Inventory, Stock counting, Ingredient requests, Approvals, Warehouse, Deliveries. The backend has no tables or
endpoints for them, so nothing is invented.

## Run it

Requirements: Node 20.19+ (or 22.12+), and the backend running on `http://localhost:8080`.

```bash
cd kitchenpulse-frontend
npm install
npm run dev          # http://localhost:5173
```

Start the backend as its own README describes (Java 21, PostgreSQL 16, `dev` profile). You manage the `DB_*`
variables yourself; see "Backend notes" below.

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on 5173 with the `/api` proxy |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build on 5173 (same proxy) |
| `npm run lint` | oxlint |
| `npm test` | 50 automated tests (see "Verification") |
| `npm run smoke` | Real HTTP checks against your running backend (see below) |

## How it connects to the backend

**Vite proxy, no CORS.** The browser only talks to `localhost:5173`. `vite.config.ts` forwards `/api/*` to
`http://localhost:8080`, so the Spring Boot CORS and security configuration needed no change. All frontend code uses
relative `/api/...` URLs. `changeOrigin` is deliberately off so the `Host` and `Origin` headers match and Spring
treats requests as same-origin.

**Production note.** The proxy exists only in the Vite dev/preview servers. A real deployment needs a reverse
proxy (nginx, Caddy, etc.) that serves the built files and forwards `/api`, or a backend CORS configuration for the
frontend's origin. That would be a backend change and was out of scope.

## Authentication and session security

Flow: `POST /api/auth/login` → store the token → `GET /api/users/me` → keep that user in React state → redirect to
`/dashboard`, which renders the dashboard for the user's role. Every request after that carries
`Authorization: Bearer <token>` through one Axios interceptor (`src/api/client.ts`). Passwords are never stored.

**Token storage: in memory + `sessionStorage`** (`src/features/auth/session.ts`).

- *Why not an HttpOnly cookie?* The backend only supports Bearer tokens (no cookies, no CSRF protection), so that
  option isn't available without backend changes.
- *XSS trade-off.* Anything that can run JavaScript on this origin can read `sessionStorage` and steal the token.
  Mitigations here: sessionStorage is per tab and cleared when the tab closes (unlike `localStorage`); the token lives
  at most 8 hours; there is no `dangerouslySetInnerHTML` and React escapes all rendered values; dependencies are
  kept minimal; the backend re-checks role and active status on every request, so a deactivated user's token stops
  working immediately.
- *Hardening for production:* serve a strict Content-Security-Policy header (not added to the Vite dev server because
  it would break hot reload), and consider a cookie-based session if the backend ever supports it.
- The backend has **no refresh and no logout endpoint**. Logout only clears client state. The session ends at the
  token's expiry (8 hours); the UI signs the user out then and shows a notice.

**Error handling** (`src/api/errors.ts`, `src/api/client.ts`):
401 on a protected call clears the session and returns to login. A 401 from the login call itself is just "wrong
password". 403 shows an access message and does not log out. Backend validation errors (`errors` map on HTTP 400)
appear under the matching form field. If the backend or database is down, pages show an error state with *Try
again*; a page refresh keeps the saved session instead of signing the user out.

## Roles and permissions

Roles are exactly the backend's: `ADMIN`, `BRANCH_STAFF`, `CENTRAL_OFFICE_STAFF`, `WAREHOUSE_MANAGER`,
`DELIVERY_PERSON`.

| | ADMIN | CENTRAL_OFFICE / WAREHOUSE | BRANCH_STAFF | DELIVERY_PERSON |
|---|---|---|---|---|
| Branches | full CRUD | read all | own branch only (`/my-branch`) | none |
| Ingredients, units | full CRUD | read | read | read |
| Users | full | none | none | none |

Hiding menu items and pages is a convenience. **The backend is the authority** and answers 403 whatever the UI shows.

## Backend limitations the UI works around (backend unchanged)

1. `GET /api/branches` and `GET /api/units` return plain arrays with no paging, search or sort → search, filter and
   paging run in the browser.
2. `GET /api/users` pages (max 100 per request, confirmed in `application.yml`) but has no search or filter, and no
   "return all" → `fetchAllUsers()` walks every page (sorted by `id` for stable pages) and the list filters client-side.
   Fine for a normal number of staff; revisit if users reach many thousands.
3. Active/inactive counts for branches and users are counted in the browser (marked *derived* on the dashboard).
   Ingredient counts use the real `active` filter.
4. Units have no get-by-id, update or delete, so the Units page is list + create.
5. There are no DELETE endpoints anywhere, so "remove" means deactivate.
6. Timestamps are `LocalDateTime` without a zone; they are written in UTC and parsed as UTC here.
7. Sorting uses Java field names (`name`, `createdAt`, `updatedAt`). An unknown sort field is not handled by the
   backend's exception handler and probably yields HTTP 500, so the UI offers only known-good sorts.
8. No logout or refresh endpoint (see above).

## Backend notes (not changed, for your information)

- `application.yml` defaults the database to `localhost:5433` / password `kp-local-dev-2026`, while
  `docker-compose.yml` publishes PostgreSQL on **5432** with password `kitchenpulse`. Set `DB_URL`, `DB_USERNAME`
  and `DB_PASSWORD` yourself (see the backend's `.env.example`) or the backend will not connect.
- `JWT_SECRET` has no default; the `dev` profile supplies one.
- A bad proxy target or a stopped backend shows up in the browser as HTTP 502/500 from the dev server; the app
  turns that into "Cannot reach the KitchenPulse server".

## Verification

What was actually run while building this (in a sandbox without your backend, database or a browser):

- `tsc -b` type-check, `oxlint` (0 warnings) and `vite build`: all pass.
- **50 automated tests** (`npm test`) running the real Axios client, interceptors, API modules, hooks, routes and
  components against an in-memory **stand-in** for the backend that follows the contract read from your source
  (`src/test/fakeBackend.ts`, test-only, never imported by the app). They cover: login and `/users/me`, Bearer
  header, 401 vs wrong-password handling, 403, validation errors, unreachable server, session restore after refresh,
  expiry, logout, role-based sidebars for all five roles, route blocking, Coming Soon pages, client-side filters,
  server-side ingredient search, create flows and 409/validation errors.
- The Vite `/api` proxy was exercised with real HTTP: `Authorization`, `Origin` and POST bodies arrive intact.
- `scripts/smoke-test.mjs` was run end to end against a throwaway mock (through the proxy and directly).

**Not yet verified: the integration with your real Spring Boot + PostgreSQL backend, and the UI in a real browser.**
Run the smoke test and click through the app to confirm.

### Smoke test against the real backend

With the backend (8080) and `npm run dev` (5173) running:

```bash
# read-only: login, /users/me, 401 cases, branches, ingredients, units, users paging
KP_EMAIL=you@example.com KP_PASSWORD='your-admin-password' npm run smoke

# also creates a branch, ingredient and BRANCH_STAFF user, checks role enforcement, then deactivates them
KP_EMAIL=you@example.com KP_PASSWORD='your-admin-password' npm run smoke -- --write
```

Use an ADMIN account. Use `-- --base http://localhost:8080` to bypass the proxy. `--write` leaves inactive records named
`SMOKE …` / `smoke.*@example.test` because the backend has no delete endpoints. Credentials are read from the
environment and never stored.

## Project structure

```
src/
├── api/            Axios client, error normalisation, one file per backend module
├── components/     common/ (buttons, cards, modal, toasts, states), forms/, tables/, layout/
├── features/       auth/, dashboard/, branches/, ingredients/, units/, users/ (pages + TanStack Query hooks)
├── hooks/          useDebounce, useClientPagination
├── layouts/        AppLayout (dark sidebar shell)
├── pages/          Forbidden, NotFound, ComingSoon
├── routes/         route table, guards, navigation config
├── test/           test-only backend stand-in and UI tests
├── types/          DTO types mirroring the backend
└── utils/          date formatting, validation rules copied from the backend DTOs
```
