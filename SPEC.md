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

**Status legend:** ✅ Done · 🟡 Partial · ❌ Not started · ➕ Built but not in PRD · ⚠️ Built but conflicts with PRD/security

---

## 1. Snapshot (as of baseline)

| Item | State |
|---|---|
| Stack in use | React 19 + Vite + Tailwind v4 + react-map-gl/Mapbox + React Query + Axios (frontend); Express 5 + TypeORM + PostgreSQL/PostGIS (backend) |
| Stack in PRD but unused | Redis/ioredis & BullMQ (installed, **zero usage**), Zod (installed, **zero usage**), Zustand (installed, unused), Resend, Cloudinary, FCM, Jest/Supertest/Playwright, Docker, CI |
| Backend size | ~14 files, ~900 LOC, 5 controllers, 6 entities, 1 router file (rest of routes inline in `index.ts`) |
| Frontend size | 5 pages + 2 components, ~2,300 LOC; UI polish is ahead of backend maturity |
| Tests / CI / Docker / migrations | **None** (`synchronize: true`, no test script) |

**Overall v1 functional-requirement progress (34 FRs):** 2 done, 14 partial, 18 not started → **≈ 26 %** (done = 1, partial = 0.5).

| Epic | FRs | ✅ | 🟡 | ❌ | Approx. % |
|---|---|---|---|---|---|
| A Identity | 6 | 1 | 3 | 2 | 33 % |
| B Resources | 5 | 0 | 3 | 2 | 30 % |
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
- Discovery falls back to **hard-coded mock items** when the API call fails.
- Profile reputation is hard-coded `5.0`.

---

## 3. PRD requirement tracker

| FR | Requirement (short) | Status | Evidence / gap |
|---|---|---|---|
| A-1 | Register w/ hashed password | ✅ | bcryptjs in `AuthController`. (No input validation, no password rules.) |
| A-2 | Mandatory email verification | ❌ | No verify endpoint, no email provider, no `verification_status`; unverified users can list/request. |
| A-3 | Profile (name, phone, address, avatar, bio) | ❌ | Only `name`; no `/users/me`, no profile UI. |
| A-4 | Home location via pin/geocode | 🟡 | `User.location` exists but register hard-codes `[-122.4, 37.8]`; no setter endpoint/UI, no geocoding. |
| A-5 | Community verification + badge | ❌ | Not modelled. |
| A-6 | Short-lived JWT + rotating refresh; validate every protected route | 🟡 | 1-day access token only; no refresh, **no middleware**. |
| B-1 | Create resource w/ full field set | 🟡 | Has category, title, desc, 1 image, duration, radius, location, donation flag. Missing: `resource_type`, multiple images, owner edit. |
| B-2 | Seven fixed categories | 🟡 | `category` is free text; UI uses ad-hoc list (Tools/Outdoors…). Not the PRD seven. |
| B-3 | Signed direct-to-CDN uploads | ❌ | ⚠️ Base64 in JSON body (50 MB limit) → local disk. |
| B-4 | Edit / pause / soft-delete | ❌ | No PATCH/DELETE, no `deleted_at`. |
| B-5 | Availability AVAILABLE/RESERVED/BORROWED/UNAVAILABLE | 🟡 | Enum has 3 values; no `RESERVED`. |
| C-1 | Map of nearby resources | ✅ | `DiscoveryPage` + `/resources/nearby`. (Uses pan center, not a persisted home location.) |
| C-2 | Radius ∈ {0.5,1,2,5 km} | 🟡 | Free slider (default 15 km, `radiusKm` arbitrary); backend default 5 km, no validation. |
| C-3 | Filter by category **and availability** | 🟡 | Category filter is client-side on loaded set; backend only returns `AVAILABLE`; no availability filter. |
| C-4 | Sort by distance and recency | 🟡 | Nearest-first only. |
| C-5 | `ST_DWithin` + GiST index | 🟡 | `ST_DWithin` used, but column is `geometry` and query casts `::geography` → the GiST index on the geometry column is **not usable**. Fix: `geography(Point,4326)` column or functional index. |
| D-1 | Request with dates/duration | 🟡 | Request has no dates/duration fields; only `security_deposit_amount`. |
| D-2 | Owner accept/reject; single active approval | 🟡 | Accept only; no reject; no lock; no ownership check; multiple ACCEPTED possible. |
| D-3 | Explicit state machine | 🟡 | Different machine (see §4); transitions not validated (any status can be set from any state). |
| D-4 | Approve→RESERVED, pickup→BORROWED | 🟡 | Resource stays AVAILABLE after accept; goes BORROWED on deposit payment; no pickup step. |
| D-5 | Return schedule + overdue flag | ❌ | No `due_date`, no sweep. |
| D-6 | Donations skip return | ❌ | `is_donation` stored but flow identical to loans. |
| E-1…E-4 | Notifications (in-app, email, reminders, announcements) | ❌ | No notification entity/endpoint/UI; BullMQ/Redis installed but unused. |
| F-1 | Ratings & reviews after completion | 🟡 | Backend endpoints exist; no UI, no completed-exchange check, no uniqueness, no participant check. |
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
| Security (JWT verify, ownership, validation, parameterized queries) | ❌/⚠️ | TypeORM params OK; no authz at all, no Zod, no rate limit, `cors()` open, hard-coded secret fallback. |
| Privacy (obfuscated location until approval) | ❌ | Exact coordinates returned in discovery. |
| Performance (P95 < 300 ms) | ❌ | Unmeasured; no cache. |
| Observability | ❌ | `console.log` only; `/api/health` exists. |
| Maintainability (tests ≥ 70 %, OpenAPI) | ❌ | No tests, no OpenAPI, no migrations. |
| Usability (responsive, empty/loading/error states) | 🟡 | Good UI work; some mock-data fallbacks mask errors. |

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
| V7 | Radius | metres, fixed set, `sharing_radius_m` | km decimal, free | Convert to fixed set in Phase 2/3. |
| V8 | Images | `image_urls[]` via Cloudinary signed upload | single `image_url`, base64 → local disk | Phase 2. |
| V9 | Resource status | `availability` + `deleted_at` | `status` (3 values) | Rename/extend in Phase 2. |
| V10 | Users | role, verification_status, phone, address… | name/email/hash/rep/location | Phase 1. Replace `email === admin@creh.com` checks with `role`. |
| V11 | Request fields | dates, due_date, timestamps, `owner_id` | none of these; owner via `resource.owner` | Phase 4. |
| V12 | Map provider | Mapbox recommended | Mapbox ✅ | Aligned. |
| V13 | Layering | modules: auth/users/resources/geo/requests… + services | fat controllers, inline routes in `index.ts` | Phase 0 refactor to routes→controller→service. |
| V14 | Schema mgmt | migrations | `synchronize: true` | Phase 0. |

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

---

## 6. Phased plan

> **Timeline note:** the PRD's 18-week / 9-sprint calendar does not match this project's actual starting point (frontend ahead, backend foundations missing, escrow/chat/dispute scope added). Phases below are **effort-based** (story points, PRD scale) with a blank **Target** column for you to fill once D-005 is settled. At solo velocity (~10–13 SP per 2 weeks) the remaining ~165 SP ≈ 26–33 weeks; with a pair ≈ 14–16 weeks.

| Phase | Theme | PRD sprint | Remaining SP | Target date | Status |
|---|---|---|---|---|---|
| 0 | Stabilize & align foundation (new) | 0 (+ gaps) | ~20 | _TBD_ | ❌ |
| 1 | Identity & user management | 1 | ~20 | _TBD_ | 🟡 |
| 2 | Resource sharing core | 2 | ~16 | _TBD_ | 🟡 |
| 3 | Location-based discovery | 3 | ~12 | _TBD_ | 🟡 |
| 4 | Request & exchange lifecycle | 4 | ~20 | _TBD_ | 🟡 |
| 5 | Notifications | 5 | 21 | _TBD_ | ❌ |
| 6 | Trust & community | 6 | ~22 | _TBD_ | ❌ |
| 7 | Admin & moderation | 7 | ~16 | _TBD_ | 🟡 (disputes only) |
| 8 | Hardening & release | 8 | ~22 | _TBD_ | ❌ |

### Phase 0 — Stabilize & align foundation  *(blocking; do first)*
**Goal:** make the existing code safe to build on. Nothing below adds user-visible features.
- [ ] **P0-01** Add `auth` middleware (verify JWT → `req.user`); remove all identity-from-body/param usage (`requesterId`, `ownerId`, `senderId`, `:userId`) in favour of `req.user.id`. *(3 SP)*
- [ ] **P0-02** Move inline routes out of `index.ts` into `routes/*.routes.ts`; introduce `services/` layer; remove `/api/resources/seed` from production routes (dev-only). *(3 SP)*
- [ ] **P0-03** Zod validation schemas at API boundary (auth, resource, request, review, chat); central error handler; consistent error shape. *(3 SP)*
- [ ] **P0-04** Env config: required `JWT_SECRET` (no fallback), `.env.example` for backend + frontend (`VITE_API_URL`, `VITE_MAPBOX_TOKEN`), restricted CORS. *(2 SP)*
- [ ] **P0-05** Turn off `synchronize`; set up TypeORM migrations with baseline migration; enable PostGIS extension in migration. *(3 SP)*
- [ ] **P0-06** Add `role` (`member|admin`) to `User`; replace every `email === "admin@creh.com"` check (frontend + backend) with role; admin-only guard for `/api/disputes*`. *(2 SP)*
- [ ] **P0-07** Dev tooling: backend lint + typecheck scripts, Jest + Supertest scaffold with test DB, `docker-compose.yml` (Postgres+PostGIS, Redis), GitHub Actions (lint→typecheck→test). *(4 SP)*
- [ ] **P0-08** Structured logging (pino) + request-id; keep `/api/health` incl. DB check. *(2 SP)*
- [ ] **P0-09** Frontend: central axios instance with auth header + 401 handling; remove mock-data fallback in Discovery (show error state instead); use `zustand` or React Query for auth state. *(2 SP)*
- [ ] **P0-10** Rewrite root `README.md` to match reality (run steps, env, scripts); link this SPEC. *(1 SP)*

**Exit criteria:** all mutating routes reject unauthenticated calls; a non-owner cannot accept/return/review someone else's request; CI green; fresh clone runs via `docker compose up` + `npm run migration:run && npm run seed`.

### Phase 1 — Identity & user management  *(FR-A-1…6)*
- [ ] **P1-01** User schema: `phone, address, avatar_url, bio, verification_status, role, deleted/suspended_at`. *(2 SP)*
- [ ] **P1-02** Email adapter (`EmailProvider` interface; console impl + Resend impl); verification code/token table; `POST /auth/verify`, resend. Block create-listing/request for `unverified`. *(8 SP, see D-004)*
- [ ] **P1-03** Access token (15 min) + rotating refresh token (hashed in DB), `POST /auth/refresh`, logout/revoke; frontend silent refresh. *(5 SP)*
- [ ] **P1-04** `GET/PATCH /users/me`; profile page UI (edit name, phone, bio, avatar). *(3 SP)*
- [ ] **P1-05** `PUT /users/me/location`: map pin + Mapbox geocoding server-side; stop hard-coding register location; location setup step in onboarding. *(5 SP)*
- [ ] **P1-06** Community verification submission + `POST /users/me/verify-community` + verified badge component. *(3 SP)*
- [ ] **P1-07** Rate limit auth endpoints; password policy. *(1 SP)*

**Exit:** register → receive email → verify → set home location → see profile with badge.

### Phase 2 — Resource sharing core  *(FR-B-1…5)*
- [ ] **P2-01** Migration: `resource_type`, `image_urls[]`, `availability` (+`RESERVED`), `deleted_at`, `sharing_radius_m` (500/1000/2000/5000), category enum (7 PRD categories; migrate existing free-text values). *(5 SP)*
- [ ] **P2-02** `GET /resources/:id`, `PATCH`, `DELETE` (soft) with ownership checks; pause/resume (`UNAVAILABLE`). *(5 SP)*
- [ ] **P2-03** `ImageStorage` adapter + `POST /resources/:id/images/sign` (Cloudinary signed upload); migrate off base64/local `uploads/` for resources (chat attachments may stay local until D-002 resolved). *(6 SP)*
- [ ] **P2-04** Frontend: create/edit listing form (7 categories, type, multi-image, radius from fixed set, duration/donation, pin on map), edit/pause/delete actions on dashboard. *(5 SP)*
- [ ] **P2-05** Validation: only email-verified users may create. *(1 SP)*

### Phase 3 — Location-based discovery  *(FR-C-1…5)*
- [ ] **P3-01** Migrate `location` columns to `geography(Point,4326)` + GiST index; update queries. *(3 SP)*
- [ ] **P3-02** `GET /discovery/nearby` with validated params: radius ∈ {500,1000,2000,5000} m, `category[]`, `availability`, `sort=distance|recent`, limit/pagination; exclude soft-deleted/hidden. *(5 SP)*
- [ ] **P3-03** Location obfuscation: snapped/jittered coordinates in discovery; exact pickup returned only after approval (depends on P4). *(3 SP)*
- [ ] **P3-04** Frontend: discrete radius selector, multi-category + availability filters server-driven, sort control; home-location default centre. *(4 SP)*
- [ ] **P3-05** Tests: radius correctness fixtures, `EXPLAIN` asserts index scan, P95 < 300 ms check at 5 km. *(3 SP)*

### Phase 4 — Request & exchange lifecycle  *(FR-D-1…6, §8)*
- [ ] **P4-01** Resolve D-001; define final state enum + legal-transition table in one `requestStateMachine.ts` (unit-tested). Add: `requested_start/end`, `due_date`, `owner_id`, `approved_at/picked_up_at/returned_at`, `OVERDUE`, `CANCELLED`, `SUPERSEDED`. *(5 SP)*
- [ ] **P4-02** Endpoints: create (with dates), approve, reject, cancel, pickup, return, with ownership + state guards (replaces accept/pay/review-return or maps onto them). *(5 SP)*
- [ ] **P4-03** Locked approval transaction (`SELECT … FOR UPDATE`; resource→RESERVED; supersede competing requests) + parallel-request concurrency test. *(8 SP)*
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
- [ ] **P8-03** Coverage ≥ 70 % on requests/geo/reputation; Playwright E2E (register→verify→list→discover→request→return→review); k6 load test + fixes. *(6 SP)*
- [ ] **P8-04** Docs: OpenAPI spec, README, ER diagram, runbook; error tracking (Sentry) on API + client. *(5 SP)*

---

## 7. Cross-cutting rules for all phases
- Every new endpoint: auth middleware → Zod validation → ownership/role check → service → controller; documented in OpenAPI once Phase 8 starts (add annotations as you go).
- Third-party calls only through adapters (`EmailProvider`, `ImageStorage`, `Geocoder`, `PushProvider`); each has a local/dev implementation.
- Schema changes only via migrations after P0-05.
- Add/maintain tests for the touched module in the same PR (state machine, geo, reputation get coverage gates).
- Exact coordinates and emails are never returned from public/discovery endpoints.

## 8. Out of scope for v1 (do not build)
Native apps, AI recommendations, QR handover, gamified leaderboards, multi-language UI, carbon dashboard, NGO/municipal integrations, emergency mode. *(In-app chat: see D-002.)*

## 9. Changelog
| Date | Phase/Task | Change | Verified by |
|---|---|---|---|
| 2026-11-17 | — | Initial audit and SPEC created from commit `58b8de5` | code review |
