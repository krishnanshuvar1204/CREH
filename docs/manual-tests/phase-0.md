# Phase 0 — Stabilize & align foundation

Setup: `docker compose up -d`, `cd backend && npm run migration:run && npm run seed && npm run dev`, `cd frontend && npm run dev`.
Replace `$API` with `http://localhost:5000/api`. Tokens: `ADMIN`, `TEST`, `BOB` (a third registered user).

Build-time evidence (2026-11-18, AI-assisted run, not yet signed off by a dev): a curl script against a throwaway PostGIS DB passed 47/47 checks covering A-01..A-13 (A-14 only the DB-up case), and A-15/A-17 were confirmed at config level. A-16, A-18, all D-* and F-* items still need a human pass. Tick the boxes only after you have run them yourself.

## API (curl or any REST client)
| ID | Steps | Expected | Pass |
|---|---|---|---|
| A-01 | `POST /requests`, `POST /resources`, `GET /users/me/requests`, `GET /disputes` with no token | 401 each | [ ] |
| A-02 | Same calls with `Authorization: Bearer garbage` | 401 | [ ] |
| A-03 | `POST /auth/register` with empty name / bad email / 1-char password | 400 with `details` | [ ] |
| A-04 | `GET /resources/nearby?lat=abc&lng=1` | 400 | [ ] |
| A-05 | Register / login / list requests / list disputes / chat responses | No `password_hash` and no `location` of users anywhere | [ ] |
| A-06 | BOB calls `accept`, `pay`, `return`, `review-return`, `messages` on a request between ADMIN and TEST | 403 each | [ ] |
| A-07 | Requester calls `accept`; owner calls `pay` | 403 | [ ] |
| A-08 | `pay` before `accept`; `accept` twice | 409 | [ ] |
| A-09 | Member (non-admin) calls `GET /disputes`, `POST /disputes/:id/resolve` | 403 | [ ] |
| A-10 | Admin lists and resolves a dispute; resolving it again | 200, then 409 | [ ] |
| A-11 | Admin opens chat of a DISPUTED request; admin opens chat of a request in another state they are not part of | 200, then 403 | [ ] |
| A-12 | BOB posts a review for a request he is not part of; participant posts rating 9 | 403; 400 | [ ] |
| A-13 | Create resource with `imageBase64` of type `image/svg+xml` | 400 | [ ] |
| A-14 | `GET /api/health` with DB up, then with DB stopped | `{"status":"ok"}`, then 503 `degraded` | [ ] |
| A-15 | Start backend with `JWT_SECRET` unset | Process exits with a clear "Missing required environment variable" error | [ ] |
| A-16 | Request from a browser origin not in `CORS_ORIGIN` | No CORS allow header | [ ] |
| A-17 | With `NODE_ENV=production`, `POST /resources/seed` | 404 | [ ] |
| A-18 | Make any request, read server log | JSON-ish log line with request id; `x-request-id` header on response; no Authorization header logged | [ ] |

## Database
| ID | Steps | Expected | Pass |
|---|---|---|---|
| D-01 | Fresh empty DB: `npm run migration:run` | Baseline + AddUserRole execute; PostGIS extension created | [ ] |
| D-02 | `npm run seed`, then check `users.role` for admin@creh.com | `admin` | [ ] |
| D-03 | `npm run migration:revert` twice, run again | Works both ways | [ ] |
| D-04 | Start backend: confirm no schema changes happen automatically (`synchronize` is off) | Adding a column to an entity without a migration does not alter the DB | [ ] |

## Frontend
| ID | Steps | Expected | Pass |
|---|---|---|---|
| F-01 | Sign up, then log in as `test@creh.com` | Lands on /profile, token in localStorage | [ ] |
| F-02 | Sign up with a 3-character password | Inline error with the validation message | [ ] |
| F-03 | Admin tab: sign in as `test@creh.com` | "This account doesn't have admin privileges" | [ ] |
| F-04 | Admin tab: sign in as admin | /admin dispute panel; "Admin panel" button visible on /profile only for admin | [ ] |
| F-05 | Visit /admin as a normal member | "Admins only" screen | [ ] |
| F-06 | Discover page with API up and seeded data | Real pins, no "Demo data" badge (in dev an empty area shows demo pins with the badge) | [ ] |
| F-07 | Stop the backend, reload /discover, /profile, /admin | Each shows sample data with the amber "Demo data" badge | [ ] |
| F-08 | While backend is down, click an action on a demo request (pay/accept) | Error toast; no fake success | [ ] |
| F-09 | Request an item as TEST, accept as owner, pay, chat, return, report damage, resolve as admin | Full lifecycle works through the UI | [ ] |
| F-10 | Delete `token` in localStorage-less state / expire token, then act | Redirected to /auth after 401 | [ ] |
| F-11 | Logout from header | Header switches to Login/Sign Up, /profile shows login prompt | [ ] |
| F-12 | `npm run build` and `npm run lint` in frontend; `npm run typecheck` in backend | Build and typecheck pass (lint warnings pre-existing) | [ ] |
