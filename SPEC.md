# CREH — Spec-Driven Development Tracker

> **Purpose:** single source of truth for AI-assisted, phase-by-phase development of CREH. It maps the PRD to the **actual codebase** so any agent (or human) can see what is done, what is partial, what is missing, and what to build next.
>
> **Baseline audited:** commit `58b8de5` on `main` (2026-11-17). Re-audit and update this file at the end of every phase.

---

## 0. How to use this file (AI agent protocol)

1. Read §1 (snapshot) and §3 (requirement tracker) first. Work only on the **current phase** (§6) unless told otherwise.
2. Every task has an ID (`P1-03`). Reference it in commits and PRs: `feat(P1-03): refresh token rotation`.
3. Before coding a task: restate its acceptance criteria, list files you will touch, check §4 (divergences) and §5 (decisions) for conflicts.
4. After finishing: tick the checkbox, update the FR status in §3, update the progress numbers in §1, and add a line to §9 (changelog).
5. Do **not** silently resolve an open decision (§5). Ask, or pick the stated default and log it.
6. Never mark `[x]` unless the acceptance criteria are verifiably met (test, curl, or manual check noted in changelog).

7. **Testing is manual (see §7a).** Do not add Jest/Supertest/Playwright/k6 suites. Instead, every task ends with a manual verification step the dev runs and records in the changelog.
8. **Mock data is the fallback (see §7b).** When an API call fails or returns nothing usable, the frontend shows clearly-labelled mock data from `frontend/src/mocks/`. Do not remove or replace fallbacks with error-only screens.

**Task checkbox legend:** `[ ]` not started · `[~]` built and AI-verified, **awaiting dev manual sign-off** · `[x]` signed off by a dev (checklist run, recorded in §9).

**Status legend:** ✅ Done · 🟡 Partial · ❌ Not started · ➕ Built but not in PRD · ⚠️ Built but conflicts with PRD/security

---

## 1. Snapshot (as of baseline)

| Item | State |
|---|---|
| Stack in use | React 19 + Vite + Tailwind v4 + react-map-gl/Mapbox + React Query + Axios (frontend); Express 5 + TypeORM + PostgreSQL/PostGIS (backend) |
| Stack in PRD but unused | Redis/ioredis & BullMQ (installed, **zero usage**), Zod (installed, **zero usage**), Zustand (installed, unused), Resend, Cloudinary, FCM, Jest/Supertest/Playwright, Docker, CI |
| Backend size | ~14 files, ~900 LOC, 5 controllers, 6 entities, 1 router file (rest of routes inline in `index.ts`) |
| Frontend size | 5 pages + 2 components, ~2,300 LOC; UI polish is ahead of backend maturity |
| Tests / CI / Docker / migrations | Testing policy: **manual by devs** (no automated suites). Phase 0 added: migrations (`synchronize` off), `docker-compose.yml`, lint/typecheck/build CI workflow, `docs/manual-tests/` |
| Current phase | **Phase 2 — built, awaiting dev sign-off** (Phases 0 and 1 also still awaiting sign-off; see §6). Snapshot sections 2–4 below describe the *original* audit baseline `58b8de5`; where Phase 0 changed things, the tracker rows are updated and marked. |
| Mock data | Discovery already falls back to hard-coded mock items when the API fails; policy is to keep and formalise this (§7b) |

**Overall v1 functional-requirement progress (34 FRs):** 10 done, 9 partial, 15 not started → **≈ 44 %** (Phases 1–2 built, awaiting sign-off) (done = 1, partial = 0.5).

| Epic | FRs | ✅ | 🟡 | ❌ | Approx. % |
|---|---|---|---|---|---|
| A Identity | 6 | 5 | 1 | 0 | 92 % |
| B Resources | 5 | 4 | 1 | 0 | 90 % |
| C Discovery | 5 | 1 | 4 | 0 | 60 % |
| D Requests | 6 | 0 | 4 | 2 | 33 % |
| E Notifications | 4 | 0 | 0 | 4 | 0 % |
| F Trust | 4 | 0 | 1 | 3 | 13 % |
| G Admin | 4 | 0 | 0 | 4 | 0 % |

---

## 2. What exists today (verified in code)

### Backend (`backend/src`)
- **Auth** — `POST /api/auth/register|login`; bcryptjs hash; JWT `{userId}` 1-day expiry; fallback secret `"supersecret"`. **No auth middleware anywhere**; identity is taken from request body/URL params (`requesterId`, `ownerId`, `senderId`, `:userId`).
- **Resources** — `GET /api/resources/nearby` (PostGIS `ST_DWithin` on `geometry::geography`, nearest-first, category filter, owner-radius geofence check, only `AVAILABLE`); `POST /api/resources` (base64 image written to local `uploads/`); `POST /api/resources/seed` (dev helper exposed as a public route); `GET /api/users/:id/resources`.
- **Requests** — create / accept / pay (mock deposit) / return / review-return, `getUserRequests`. No reject, cancel, pickup, overdue, transactions or locking. No ownership/role checks.
- **Disputes** — list + resolve (admin identified only by frontend check `email === admin@creh.com`; the API is unprotected).
- **Reviews** — `POST /api/reviews`, `GET /api/users/:id/reviews`. Reputation is never recomputed.
- **Chat** — per-request messages with base64 photo attachments; frontend polls every 3 s. No participant check.
- **Entities** — `User, Resource, Request, Review, Dispute, Message`. `seed.ts` creates admin/test users and sample items.

### Frontend (`frontend/src`)
- Landing page, Auth page (user/admin toggle, token in `localStorage`), Discovery (Mapbox map, list, search, category chips derived from loaded data, free-only toggle, radius slider 1–N km, request modal), Dashboard (my listings, borrowing/lending request tracker, create-listing form with image + geolocation, return/report-damage flows), Admin dispute panel, Chat modal.
- Discovery falls back to **hard-coded mock items** inline in `DiscoveryPage.tsx` when the API call fails (intended behaviour; to be moved to `src/mocks/` and labelled, P0-09).
- Profile reputation is hard-coded `5.0`.

---

## 3. PRD requirement tracker

| FR | Requirement (short) | Status | Evidence / gap |
|---|---|---|---|
| A-1 | Register w/ hashed password | ✅ | bcryptjs in `AuthController`. (No input validation, no password rules.) |
| A-2 | Mandatory email verification | ✅ | **P1:** 6-digit code (hashed, 15 min, 5 attempts, 60 s resend cooldown) via `EmailProvider` (console/Resend); `POST /auth/verify`, `/auth/verify/resend`; `requireVerified` blocks create-listing and create-request. Awaiting sign-off. |
| A-3 | Profile (name, phone, address, avatar, bio) | ✅ | **P1:** `GET/PATCH /users/me` + Settings page (avatar is base64 → local disk until Phase 2 image storage). Awaiting sign-off. |
| A-4 | Home location via pin/geocode | ✅ | **P1:** `PUT /users/me/location` (pin or address via `Geocoder` adapter; Mapbox when `MAPBOX_ACCESS_TOKEN` set); register no longer hard-codes a location; Settings map picker. Discovery does not yet default to it (Phase 3, P3-04). Awaiting sign-off. |
| A-5 | Community verification + badge | 🟡 | **P1:** submission endpoint + `community_pending` status + badge component. Approval is manual (SQL) until the Phase 7 admin UI. |
| A-6 | Short-lived JWT + rotating refresh; validate every protected route | ✅ | **P0:** `requireAuth` on every protected route. **P1:** 15-min access token, hashed rotating refresh tokens with reuse detection, `/auth/refresh`, `/auth/logout`, frontend silent refresh; suspended/deleted users rejected. Awaiting sign-off. |
| B-1 | Create resource w/ full field set | ✅ | **P2:** title, description, category enum, `resource_type`, up to 5 images, `sharing_radius_m`, duration, location; owner edit via `PATCH`. Awaiting sign-off. |
| B-2 | Seven fixed categories | ✅ | **P2:** DB enum + Zod + UI chips/select use one fixed list (see D-009 for the assumed seven); old free text migrated. Awaiting sign-off. |
| B-3 | Signed direct-to-CDN uploads | ✅ | **P2:** `ImageStorage` adapter + `POST /resources/:id/images/sign`; Cloudinary signed upload when `CLOUDINARY_*` set, else local-disk fallback (D-004). Cloudinary path not exercised without an account. Awaiting sign-off. |
| B-4 | Edit / pause / soft-delete | ✅ | **P2:** `PATCH`/`DELETE /resources/:id` with owner checks, pause/resume, `deleted_at` soft delete (history kept, pending requests declined, blocked while an exchange is open). Awaiting sign-off. |
| B-5 | Availability AVAILABLE/RESERVED/BORROWED/UNAVAILABLE | 🟡 | **P2:** column renamed `availability`, `RESERVED` added. Nothing sets RESERVED until the Phase 4 approval flow. |
| C-1 | Map of nearby resources | ✅ | `DiscoveryPage` + `/resources/nearby`. (Uses pan center, not a persisted home location.) |
| C-2 | Radius ∈ {0.5,1,2,5 km} | 🟡 | Free slider (default 15 km, `radiusKm` arbitrary); backend default 5 km, no validation. |
| C-3 | Filter by category **and availability** | 🟡 | Category filter is client-side on loaded set; backend only returns `AVAILABLE`; no availability filter. |
| C-4 | Sort by distance and recency | 🟡 | Nearest-first only. |
| C-5 | `ST_DWithin` + GiST index | 🟡 | `ST_DWithin` used, but column is `geometry` and query casts `::geography` → the GiST index on the geometry column is **not usable**. Fix: `geography(Point,4326)` column or functional index. |
| D-1 | Request with dates/duration | 🟡 | Request has no dates/duration fields; only `security_deposit_amount`. |
| D-2 | Owner accept/reject; single active approval | 🟡 | **P0:** owner-only accept with state guard. Still no reject, no row lock, multiple ACCEPTED possible (Phase 4). |
| D-3 | Explicit state machine | 🟡 | Different machine (see §4). **P0:** each transition now checks role and current state (409 otherwise); not yet a single transition table. |
| D-4 | Approve→RESERVED, pickup→BORROWED | 🟡 | Resource stays AVAILABLE after accept; goes BORROWED on deposit payment; no pickup step. |
| D-5 | Return schedule + overdue flag | ❌ | No `due_date`, no sweep. |
| D-6 | Donations skip return | ❌ | `is_donation` stored but flow identical to loans. |
| E-1…E-4 | Notifications (in-app, email, reminders, announcements) | ❌ | No notification entity/endpoint/UI; BullMQ/Redis installed but unused. |
| F-1 | Ratings & reviews after completion | 🟡 | Backend endpoints exist. **P0:** reviewer must be a party of the request and reviewee the other party; rating 1–5 validated. Still no UI, no completed-exchange check, no uniqueness (Phase 6). |
| F-2 | Reputation score derived | ❌ | Column exists; never computed; UI hard-coded. |
| F-3 | Verified + milestone badges | ❌ | — |
| F-4 | Community groups & announcements | ❌ | — |
| G-1 | Admin user list/search/suspend/verify | ❌ | — |
| G-2 | Resource moderation + resolve reports | ❌ | — |
| G-3 | User reports + moderation queue | ❌ | — |
| G-4 | Analytics dashboard | ❌ | — |

### Non-functional requirement status
| NFR | Status | Note |
|---|---|---|
| Security (JWT verify, ownership, validation, parameterized queries) | 🟡 | **P1:** short-lived access + rotating refresh tokens, auth rate limiting, password policy. **P0:** JWT middleware, ownership/role checks, Zod validation on all inputs, no secret fallback, CORS restricted, password hash and user home location no longer returned by the API, image type/size checks. Still missing: rate limits on write endpoints, helmet (Phase 8). |
| Privacy (obfuscated location until approval) | ❌ | Exact coordinates returned in discovery. |
| Performance (P95 < 300 ms) | ❌ | Unmeasured; no cache. |
| Observability | 🟡 | **P0:** pino structured logs with request id, `/api/health` checks the DB. No error tracking or metrics yet (Phase 8). |
| Maintainability (OpenAPI, typed, layered) | ❌ | No OpenAPI, no migrations. PRD's ≥ 70 % automated coverage target is **replaced by manual test checklists** (§7a). |
| Usability (responsive, empty/loading/error states) | 🟡 | Good UI work. Mock-data fallback is intentional; it must be visibly labelled so it doesn't mask real failures (§7b). |

---

## 4. Divergences between PRD and codebase

| # | Area | PRD | Codebase | Recommended handling |
|---|---|---|---|---|
| V1 | Exchange flow | PENDING→APPROVED→BORROWED→RETURNED→COMPLETED; no money | PENDING→ACCEPTED→(mock deposit)→ACTIVE→RETURNED_PENDING_REVIEW→COMPLETED/DISPUTED→RESOLVED_* | See D-001. Default: **keep deposit/dispute as an optional layer** on top of the PRD state machine. |
| V2 | In-app chat | Out of scope v1 | Implemented (polling, photos) | See D-002. Default: keep, mark ➕, no further investment in v1. |
| V3 | Dispute/admin | Admin = users, moderation, reports, analytics | Admin = disputes only | Keep disputes; add PRD admin features in Phase 7. |
| V4 | IDs | UUID PKs | Auto-increment ints | See D-003. Default: keep ints (changing is churn with low value). |
| V5 | Status naming | lowercase/`APPROVED`, `BORROWED`, `RETURNED` | `ACCEPTED`, `ACTIVE`, `RETURNED_PENDING_REVIEW` | Map in Phase 4 (migration + frontend labels). |
| V6 | Geo column | `GEOGRAPHY(Point,4326)` | `geometry` + cast | Fix in Phase 3. |
| V7 | Radius | metres, fixed set, `sharing_radius_m` | ~~km decimal, free~~ → **P2:** `sharing_radius_m` in {500,1000,2000,5000}. Discovery search radius is still a free km slider until Phase 3. | Done for sharing radius (awaiting sign-off). |
| V8 | Images | `image_urls[]` via Cloudinary signed upload | ~~single `image_url`~~ → **P2:** `image_urls[]` + signed-upload adapter (resources). Avatars/chat still base64 → local disk. | Done for resources (awaiting sign-off). |
| V9 | Resource status | `availability` + `deleted_at` | ~~`status`~~ → **P2:** `availability` (+`RESERVED`) and `deleted_at`. | Done (awaiting sign-off). |
| V10 | Users | role, verification_status, phone, address… | name/email/hash/rep/location/**role** | `role` (P0) and profile/verification/suspension fields (P1) done. |
| V11 | Request fields | dates, due_date, timestamps, `owner_id` | none of these; owner via `resource.owner` | Phase 4. |
| V12 | Map provider | Mapbox recommended | Mapbox ✅ | Aligned. |
| V13 | Layering | modules: auth/users/resources/geo/requests… + services | ~~fat controllers, inline routes~~ → **resolved in P0**: routes → controllers → services, Zod schemas, middleware | Done (awaiting sign-off). |
| V14 | Schema mgmt | migrations | ~~`synchronize: true`~~ → **resolved in P0**: baseline + AddUserRole migrations | Done (awaiting sign-off). Existing dev DBs must be recreated (README). |

---

## 5. Decisions log (open items need the project owner)

| ID | Decision | Default if unanswered | Status |
|---|---|---|---|
| D-001 | Keep mock security-deposit/escrow + dispute flow? | Keep as optional per-request deposit (`deposit_amount` null ⇒ no deposit); unify state names with PRD | **OPEN** |
| D-002 | Keep chat though PRD defers it? | Keep as-is (➕), freeze scope | **OPEN** |
| D-003 | Migrate int IDs → UUID? | No | **OPEN** |
| D-004 | Real third-party providers now or adapters + local fallbacks first? | Adapter interface + local/console implementation first; plug Resend/Cloudinary in their phase | **OPEN** |
| D-005 | Timeline / team size (PRD assumes 9 × 2-week sprints for a pair) | Solo, phases are effort-based, no fixed dates until set in §6 | **OPEN** |
| D-006 | Distance unit exposure (km in UI vs metres in API) | UI shows m/km, API uses metres | **OPEN** |
| D-007 | Testing approach | **Manual testing by devs**; no automated test suites in v1. Supersedes PRD §12 | **DECIDED** |
| D-009 | The PRD seven categories and `resource_type` values are not in the repo | **Assumed** categories `tools, electronics, outdoors, furniture, kitchen, books, other` and `resource_type` in `LOAN, DONATION` (kept in sync with `is_donation`). If the PRD differs: change one enum, `frontend/src/lib/resourceMeta.ts`, and add a migration | **ASSUMED — please confirm** |
| D-008 | Failure behaviour of frontend data calls | **Fall back to mock data** (labelled "Demo data") instead of error-only screens | **DECIDED** |

---

## 6. Phased plan

> **Timeline note:** the PRD's 18-week / 9-sprint calendar does not match this project's actual starting point (frontend ahead, backend foundations missing, escrow/chat/dispute scope added). Phases below are **effort-based** (story points, PRD scale) with a blank **Target** column for you to fill once D-005 is settled. At solo velocity (~10–13 SP per 2 weeks) the remaining ~165 SP ≈ 26–33 weeks; with a pair ≈ 14–16 weeks.

| Phase | Theme | PRD sprint | Remaining SP | Target date | Status |
|---|---|---|---|---|---|
| 0 | Stabilize & align foundation (new) | 0 (+ gaps) | ~0 (dev sign-off pending) | _TBD_ | 🟡 built, awaiting sign-off |
| 1 | Identity & user management | 1 | ~0 (dev sign-off pending) | _TBD_ | 🟡 built, awaiting sign-off |
| 2 | Resource sharing core | 2 | ~0 (dev sign-off pending) | _TBD_ | 🟡 built, awaiting sign-off |
| 3 | Location-based discovery | 3 | ~12 | _TBD_ | 🟡 |
| 4 | Request & exchange lifecycle | 4 | ~20 | _TBD_ | 🟡 |
| 5 | Notifications | 5 | 21 | _TBD_ | ❌ |
| 6 | Trust & community | 6 | ~22 | _TBD_ | ❌ |
| 7 | Admin & moderation | 7 | ~16 | _TBD_ | 🟡 (disputes only) |
| 8 | Hardening & release | 8 | ~22 | _TBD_ | ❌ |

### Phase 0 — Stabilize & align foundation  *(blocking; do first)*
**Goal:** make the existing code safe to build on. Nothing below adds user-visible features.
- [~] **P0-01** Add `auth` middleware (verify JWT → `req.user`); remove all identity-from-body/param usage (`requesterId`, `ownerId`, `senderId`, `:userId`) in favour of `req.user.id`. *(3 SP)*
- [~] **P0-02** Move inline routes out of `index.ts` into `routes/*.routes.ts`; introduce `services/` layer; remove `/api/resources/seed` from production routes (dev-only). *(3 SP)*
- [~] **P0-03** Zod validation schemas at API boundary (auth, resource, request, review, chat); central error handler; consistent error shape. *(3 SP)*
- [~] **P0-04** Env config: required `JWT_SECRET` (no fallback), `.env.example` for backend + frontend (`VITE_API_URL`, `VITE_MAPBOX_TOKEN`), restricted CORS. *(2 SP)*
- [~] **P0-05** Turn off `synchronize`; set up TypeORM migrations with baseline migration; enable PostGIS extension in migration. *(3 SP)*
- [~] **P0-06** Add `role` (`member|admin`) to `User`; replace every `email === "admin@creh.com"` check (frontend + backend) with role; admin-only guard for `/api/disputes*`. *(2 SP)*
- [~] **P0-07** Dev tooling: backend lint + typecheck scripts, `docker-compose.yml` (Postgres+PostGIS, Redis), optional GitHub Actions (lint→typecheck→build only; no test job). Create `docs/manual-tests/` with a checklist template (§7a). *(3 SP)*
- [~] **P0-08** Structured logging (pino) + request-id; keep `/api/health` incl. DB check. *(2 SP)*
- [~] **P0-09** Frontend: central axios instance with auth header + 401 handling; move inline mock data to `frontend/src/mocks/` with a small `withMockFallback(fetcher, mock)` helper and a visible "Demo data" badge when active; use `zustand` or React Query for auth state. *(2 SP)*
- [~] **P0-10** Rewrite root `README.md` to match reality (run steps, env, scripts); link this SPEC. *(1 SP)*

**Exit criteria:** all mutating routes reject unauthenticated calls; a non-owner cannot accept/return/review someone else's request (verified manually with two accounts); lint/typecheck pass; fresh clone runs via `docker compose up` + `npm run migration:run && npm run seed`; Phase 0 manual checklist signed off.

**Build notes / deviations (2026-11-18):**
- Checklist: [docs/manual-tests/phase-0.md](docs/manual-tests/phase-0.md). To close the phase, a dev runs it and ticks it, then flips `[~]` → `[x]` above.
- Identity now comes only from the JWT. API paths changed: `/users/:id/requests|resources` → `/users/me/requests|resources`; request bodies no longer carry `requesterId`/`ownerId`/`senderId`/`reviewerId`.
- `password_hash` and `users.location` are `select: false`, so they are never serialized in API responses.
- Backend "lint" is a TypeScript typecheck alias (no ESLint added). CI runs typecheck + frontend lint/build only (no tests, per D-007).
- Mock fallback applies to Discovery, Dashboard and Admin reads. Chat polling is exempt (a fake conversation would mislead); chat errors surface normally.
- `uploads/` image handling still base64 → local disk (Phase 2 replaces it), now limited to PNG/JPEG/WebP/GIF and 8 MB.
- Deliberately not changed: ID type (D-003), deposit/dispute and chat flow (D-001/D-002 still open), category free text.
- Local setup needs a new `JWT_SECRET` in `backend/.env`; existing dev DBs must be recreated before running migrations (see README).

### Phase 1 — Identity & user management  *(FR-A-1…6)*
- [~] **P1-01** User schema: `phone, address, avatar_url, bio, verification_status, role, deleted/suspended_at`. *(2 SP)*
- [~] **P1-02** Email adapter (`EmailProvider` interface; console impl + Resend impl); verification code/token table; `POST /auth/verify`, resend. Block create-listing/request for `unverified`. *(8 SP, see D-004)*
- [~] **P1-03** Access token (15 min) + rotating refresh token (hashed in DB), `POST /auth/refresh`, logout/revoke; frontend silent refresh. *(5 SP)*
- [~] **P1-04** `GET/PATCH /users/me`; profile page UI (edit name, phone, bio, avatar). *(3 SP)*
- [~] **P1-05** `PUT /users/me/location`: map pin + Mapbox geocoding server-side; stop hard-coding register location; location setup step in onboarding. *(5 SP)*
- [~] **P1-06** Community verification submission + `POST /users/me/verify-community` + verified badge component. *(3 SP)*
- [~] **P1-07** Rate limit auth endpoints; password policy. *(1 SP)*

**Exit:** register → receive email → verify → set home location → see profile with badge.

**Build notes / deviations (2026-11-24):**
- Checklist: [docs/manual-tests/phase-1.md](docs/manual-tests/phase-1.md). A dev runs it, ticks it, then flips `[~]` → `[x]`.
- Migration `Phase1Identity` adds the user columns, `email_verifications` and `refresh_tokens`. Existing users are **grandfathered as `email_verified`**; the old hard-coded placeholder home location is cleared. Seed users are pre-verified.
- D-004 default applied: `EMAIL_PROVIDER=console` (code printed in the API log) or `resend` (needs `RESEND_API_KEY`, `EMAIL_FROM`). Geocoding is an adapter too: Mapbox server-side when `MAPBOX_ACCESS_TOKEN` is set, otherwise address search returns 503 and users drop a pin / use browser geolocation.
- Verification statuses: `unverified → email_verified → community_pending → community_verified`. Community approval has no admin UI yet (Phase 7); approve by SQL for now. Submission requires a verified email and a saved home location.
- Auth responses now return `{ token, refreshToken, user }`; `POST /auth/verify` and `/auth/verify/resend` require a (not necessarily verified) session. Login deliberately does **not** enforce the new password policy, so seeded `test`/`admin` passwords still work.
- Refresh tokens: opaque, SHA-256 hashed, 30-day TTL (`REFRESH_TOKEN_TTL_DAYS`), single-use; re-using a rotated token revokes its whole family. Logout revokes the family. Tokens are kept in `localStorage` (same exposure as the old access token); httpOnly cookies are a Phase 8 hardening option. Sessions created before this change have no refresh token and need one re-login.
- `JWT_EXPIRES_IN` default is now `15m`. Rate limits are in-memory per process (fine for one API instance; revisit with Redis in Phase 8) and can be disabled with `RATE_LIMIT_ENABLED=false`.
- Discovery still centres on the map pan position; defaulting to the saved home location is P3-04. Avatar upload reuses the base64 local-disk path until Phase 2.
- Not changed: soft-delete/suspend have no endpoints yet (columns exist and are enforced at auth; admin tooling is Phase 7).

### Phase 2 — Resource sharing core  *(FR-B-1…5)*
- [~] **P2-01** Migration `Phase2Resources`: `resource_type`, `image_urls[]`, `availability` (+`RESERVED`), `deleted_at`, `sharing_radius_m` (500/1000/2000/5000, CHECK constraint), category enum (7 values; existing free text mapped). *(5 SP)*
- [~] **P2-02** `GET /resources/:id`, `PATCH`, `DELETE` (soft) with ownership checks; pause/resume (`UNAVAILABLE`); `GET /resources/options`. *(5 SP)*
- [~] **P2-03** `ImageStorage` adapter + `POST /resources/:id/images/sign`, `POST/DELETE /resources/:id/images`; Cloudinary signed upload with local fallback. *(6 SP)*
- [~] **P2-04** Frontend: shared create/edit form (7 categories, type, multi-image, radius from fixed set, duration, map pin / use my location), edit/pause/delete on dashboard, Discovery uses fixed categories and `image_urls`. *(5 SP)*
- [~] **P2-05** Only email-verified users may create, edit or add images (delete stays allowed). *(1 SP)*

**Exit:** a verified user can create, edit, pause/resume and delete a listing with several photos; deleted items vanish from discovery but keep request history.

**Build notes / deviations (2026-11-28):**
- Checklist: [docs/manual-tests/phase-2.md](docs/manual-tests/phase-2.md). A dev runs it, ticks it, then flips `[~]` → `[x]`.
- Migration is data-preserving and reversible. Existing km radii are rounded up to the next allowed value and capped at 5 km, so old 10-20 km listings become 5 km. Discovery's own search radius (free km slider) is unchanged until Phase 3.
- Listing creation no longer accepts `imageBase64`; the client creates the item, then attaches photos (`sign` → direct upload → `POST /images`, or base64 on the local provider). A failed photo upload leaves the item saved and tells the user to retry via Edit.
- `owns(url)` guards `POST /images {url}` so only our storage URLs can be attached. Cloudinary assets are not deleted remotely when a photo is removed (needs the admin API); local files are.
- Request history uses `withDeleted` so exchanges for a soft-deleted item still load. Deleting declines PENDING requests; ACCEPTED/ACTIVE/RETURNED_PENDING_REVIEW/DISPUTED block deletion (409).
- `GET /resources/*` returns only public owner fields (`id`, `name`, `reputation_score`). Exact-location obfuscation is still Phase 3 (P3-03).
- D-009 (category list and `resource_type` values) is an assumption and needs the owner to confirm against the PRD.
- Noted, not changed: `/users/me/requests` returns the counterparty's full user object (email, phone, etc.). This predates Phase 2; tighten it in Phase 4 (requests rework) or the Phase 8 security pass.

### Phase 3 — Location-based discovery  *(FR-C-1…5)*
- [ ] **P3-01** Migrate `location` columns to `geography(Point,4326)` + GiST index; update queries. *(3 SP)*
- [ ] **P3-02** `GET /discovery/nearby` with validated params: radius ∈ {500,1000,2000,5000} m, `category[]`, `availability`, `sort=distance|recent`, limit/pagination; exclude soft-deleted/hidden. *(5 SP)*
- [ ] **P3-03** Location obfuscation: snapped/jittered coordinates in discovery; exact pickup returned only after approval (depends on P4). *(3 SP)*
- [ ] **P3-04** Frontend: discrete radius selector, multi-category + availability filters server-driven, sort control; home-location default centre. *(4 SP)*
- [ ] **P3-05** Manual verification: seed fixtures at known distances and confirm each radius includes/excludes the right items; run `EXPLAIN ANALYZE` in psql and confirm an index scan; eyeball response time at 5 km (target < 300 ms). Record results. *(2 SP)*

### Phase 4 — Request & exchange lifecycle  *(FR-D-1…6, §8)*
- [ ] **P4-01** Resolve D-001; define final state enum + legal-transition table in one `requestStateMachine.ts` (unit-tested). Add: `requested_start/end`, `due_date`, `owner_id`, `approved_at/picked_up_at/returned_at`, `OVERDUE`, `CANCELLED`, `SUPERSEDED`. *(5 SP)*
- [ ] **P4-02** Endpoints: create (with dates), approve, reject, cancel, pickup, return, with ownership + state guards (replaces accept/pay/review-return or maps onto them). *(5 SP)*
- [ ] **P4-03** Locked approval transaction (`SELECT … FOR UPDATE`; resource→RESERVED; supersede competing requests) + manual concurrency check (two browsers/curl scripts approving two requests for the same item at once; exactly one succeeds). *(7 SP)*
- [ ] **P4-04** Donations skip return (→COMPLETED on pickup). *(1 SP)*
- [ ] **P4-05** Overdue flagging (partial index on `due_date`; sweep hook for Phase 5 scheduler). *(2 SP)*
- [ ] **P4-06** Frontend: request form with dates, owner/borrower dashboards updated to new statuses; reveal exact pickup after approval. *(4 SP)*
- [ ] **P4-07** Decide fate of deposit/dispute under new states and implement accordingly. *(per D-001)*

### Phase 5 — Notifications  *(FR-E-1…4)*
- [ ] **P5-01** `notifications` entity + `GET /notifications?unread=`, `POST /:id/read`, read-all. *(5 SP)*
- [ ] **P5-02** BullMQ queue + worker process; email job with retries/backoff via `EmailProvider`. *(5 SP)*
- [ ] **P5-03** Repeatable reminder sweep (borrow-due-soon, return-due, overdue escalation) + delayed one-offs. *(6 SP)*
- [ ] **P5-04** Emit notifications from lifecycle events (new request, approve/reject, pickup, return, cancel). *(3 SP)*
- [ ] **P5-05** Frontend notification centre (bell, unread count, list, mark read). *(2 SP)*
- [ ] **P5-06** *(optional)* Web push adapter (FCM), SMS adapter stub.

### Phase 6 — Trust & community  *(FR-F-1…4)*
- [ ] **P6-01** Reviews: only participants of a `COMPLETED/RETURNED` request, one per direction (unique constraint), rating 1–5 validated. *(5 SP)*
- [ ] **P6-02** Reputation formula (weighted rating + log-dampened completions + verification bonus), async recompute job, Redis cache, `GET /users/:id/reputation`; remove hard-coded `5.0` in UI. *(6 SP)*
- [ ] **P6-03** Badges (verified + milestone). *(4 SP)*
- [ ] **P6-04** Community groups: create/join, group announcements → notifications. *(6 SP)*
- [ ] **P6-05** Frontend: review prompt after return, profile reputation/reviews, group pages. *(3 SP)*

### Phase 7 — Admin & moderation  *(FR-G-1…4)*
- [ ] **P7-01** Admin role gate on `/admin/*`; user list/search/suspend/verify (suspended users blocked at auth). *(5 SP)*
- [ ] **P7-02** Resource moderation (hide/remove). *(3 SP)*
- [ ] **P7-03** Reports (users/resources) + moderation queue + resolve. Existing dispute panel folded into the queue or kept alongside. *(5 SP)*
- [ ] **P7-04** `GET /admin/analytics/summary` + dashboard UI (users, listings, exchanges, category mix, request-to-decision time). *(8 SP)*

### Phase 8 — Hardening & release
- [ ] **P8-01** Redis cache for nearby search (geohash+radius+filter key, TTL, invalidation on listing change). *(6 SP)*
- [ ] **P8-02** Security pass: authz audit of every route, validation sweep, rate limits on writes, helmet, secrets review. *(5 SP)*
- [ ] **P8-03** Full manual regression pass over every phase checklist, including the end-to-end journey (register→verify→list→discover→request→return→review) on desktop and mobile widths; manual latency spot-checks on nearby search; fix findings. *(4 SP)*
- [ ] **P8-04** Docs: OpenAPI spec, README, ER diagram, runbook; error tracking (Sentry) on API + client. *(5 SP)*

---

## 7. Cross-cutting rules for all phases
- Every new endpoint: auth middleware → Zod validation → ownership/role check → service → controller; documented in OpenAPI once Phase 8 starts (add annotations as you go).
- Third-party calls only through adapters (`EmailProvider`, `ImageStorage`, `Geocoder`, `PushProvider`); each has a local/dev implementation.
- Schema changes only via migrations after P0-05.
- Update the phase's manual checklist in the same PR as the code change (see §7a).
- Exact coordinates and emails are never returned from public/discovery endpoints.

## 7a. Manual testing policy (replaces PRD §12)
- **No automated test suites** in v1 (no Jest, Supertest, Playwright, k6). PRD's ≥ 70 % coverage gate and success metric are dropped; the PRD "core-module coverage" metric is replaced by "all manual checklist items pass".
- **Who/when:** the dev who builds a task runs its checklist before ticking it; a second dev (or the owner) re-runs the phase checklist at phase end.
- **Where:** `docs/manual-tests/phase-N.md`, one file per phase, each item written as `Steps → Expected result → [ ] Pass`. Record date + tester in the changelog (§9).
- **Test data:** use the seeded accounts (`admin@creh.com`, `test@creh.com`) plus a second self-registered user for two-party flows.
- **Minimum checks per phase:**
  - P0: unauthenticated call to every mutating route → 401; user B cannot act on user A's request/resource.
  - P1: register, verify, login, refresh, logout, unverified user blocked from listing/requesting.
  - P2: create/edit/pause/delete listing, image upload visible via CDN URL, soft-deleted item hidden but history intact.
  - P3: each radius, category and availability filter, sort order, exact location not exposed.
  - P4: every legal transition works, every illegal transition is rejected, double-approval race, donation skips return.
  - P5: in-app + email notification per event, reminder fires (shorten due dates/intervals for testing), email failure retried.
  - P6: review allowed once per direction only after completion, reputation updates, group announcement delivery.
  - P7: non-admin blocked from `/admin/*`, suspend/hide/resolve flows, analytics numbers match DB counts.
  - P8: cache hit vs invalidation after listing change, full end-to-end journey, mobile layout.
- Verification evidence for AI agents: provide the exact curl/UI steps for the dev to run; never claim a task is "tested" without the dev's recorded result.

## 7b. Mock data fallback policy
- **Rule:** if a frontend data request fails (network error, 5xx, empty response during dev), the UI renders mock data instead of a blank/error page, and shows a visible **"Demo data"** badge/banner so devs and users can tell it is not real.
- **Location:** all mock fixtures live in `frontend/src/mocks/` (e.g. `resources.ts`, `requests.ts`, `notifications.ts`, `reviews.ts`, `adminAnalytics.ts`), typed with the same TypeScript types as the real API responses so they cannot drift silently.
- **Helper:** one shared `withMockFallback(fetcher, mock)` (or React Query `placeholderData`/`select` wrapper) used by every page; no ad-hoc inline mock arrays.
- **Scope:** new features in each phase ship with a matching mock fixture (e.g. Phase 5 notification centre must render with mock notifications when the API is down).
- **Mutations:** write actions (create, approve, pay…) do **not** pretend to succeed on failure; show the error toast. Only reads fall back.
- **Safety:** mocks are never returned by the backend, never contain real user data, and the "Demo data" state must be disabled or hidden in production builds unless `VITE_ENABLE_MOCK_FALLBACK=true`. Default: enabled in dev, enabled in demo builds.
- **Backend side:** `seed.ts` remains the source of sample data for local/demo databases; `/resources/seed` stays dev-only (P0-02).

## 8. Out of scope for v1 (do not build)
Automated test suites (see §7a), native apps, AI recommendations, QR handover, gamified leaderboards, multi-language UI, carbon dashboard, NGO/municipal integrations, emergency mode. *(In-app chat: see D-002.)*

## 9. Changelog
| Date | Phase/Task | Change | Verified by |
|---|---|---|---|
| 2026-11-17 | — | Initial audit and SPEC created from commit `58b8de5` | code review |
| 2026-11-18 | Phase 0 | P0-01…P0-10 built (auth middleware, services/routes split, Zod, env, migrations, roles, docker-compose + CI, pino, frontend api/store/mocks, README). Marked `[~]`. | AI-run: backend `tsc` clean; frontend `tsc -b` + `vite build` pass; 47/47 curl checks against a throwaway PostGIS DB (auth, validation, ownership, lifecycle, admin gating, no hash leak). **Dev sign-off of docs/manual-tests/phase-0.md still required.** |
| 2026-11-18 | Policy | Testing switched to manual (D-007, §7a); mock-data fallback adopted (D-008, §7b); tasks P0-07, P0-09, P3-05, P4-03, P8-03 adjusted | spec edit |
| 2026-11-24 | Phase 1 | P1-01…P1-07 built (identity schema + migration, email verification via EmailProvider, rotating refresh tokens + silent refresh, `/users/me` profile, home location with Geocoder adapter, community verification submission + badge, auth rate limits + password policy, verify-email and Settings pages). Marked `[~]`. | AI-run: backend `tsc` clean; frontend `tsc -b` and `vite build` pass, oxlint shows no warnings in touched files; curl checks against a throwaway PostGIS DB: migration up, weak-password rejection, 403 on listing/request while unverified then 201 after verify, wrong-code attempt lockout, resend 429 cooldown, refresh rotation + reuse revocation + logout revoke, profile PATCH/validation, pin location save + coordinate validation, 503 geocode without token, community_pending flow, suspended user 403 (token + login), login limiter 429 after repeated failures. **Not browser-tested** (new pages, silent refresh, map picker); **dev sign-off of docs/manual-tests/phase-1.md required.** |
| 2026-11-28 | Phase 2 | P2-01…P2-05 built (resource schema migration, CRUD + pause + soft delete, image storage adapter with Cloudinary signing + local fallback, shared create/edit form, dashboard actions, Discovery updated). Marked `[~]`. | AI-run: backend `tsc` clean; frontend `tsc -b` + `vite build` pass. Against a throwaway PostGIS container: Phase 2 migration up/down/up on legacy rows (category/radius/image mapping correct); curl checks for enum/radius validation (400), unverified create (403), stranger PATCH/DELETE/images (403), public GET without owner email, nearby honours pause/resume and owner radius, base64 image add/remove (file deleted), foreign-URL rejection, 5-photo cap, soft delete keeps request history and hides the item, pending request auto-declined, ACCEPTED request blocks delete (409). **Not browser-tested** (form modal, map pin, dashboard actions); Cloudinary path untested (no account); **dev sign-off of docs/manual-tests/phase-2.md required.** |
