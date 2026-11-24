# Community Resource Exchange Hub (CREH)

**Share more. Buy less.** CREH is a full-stack web app that lets neighbours lend, borrow and share physical resources within a radius of their location. It includes geospatial discovery, a request lifecycle with a mock security deposit, per-request chat, and admin dispute resolution.

Development is spec-driven and phased. See **[SPEC.md](SPEC.md)** for the PRD-to-code tracker, current phase and decisions, and **[docs/manual-tests/](docs/manual-tests/)** for the manual test checklists (testing is manual by policy).

## Tech stack
- **Frontend:** Vite, React 19 (TypeScript), Tailwind CSS v4, React Query, Zustand, react-map-gl + Mapbox
- **Backend:** Node.js, Express 5 (TypeScript), TypeORM, Zod, pino
- **Data:** PostgreSQL + PostGIS (Redis is provisioned for later phases)

## Quick start

Prerequisites: Node 22+, Docker (or your own PostgreSQL with PostGIS).

```bash
# 1. Database (PostGIS) and Redis
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env            # then set JWT_SECRET (see the comment in the file)
npm install
npm run migration:run           # creates the schema; synchronize is OFF
npm run seed                    # admin + test users and sample items
npm run dev                     # http://localhost:5000  (health: /api/health)

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env            # set VITE_MAPBOX_TOKEN
npm install
npm run dev                     # http://localhost:5173
```

**Already have a dev database created by an older version of this repo** (schema auto-synced, no migrations table)? The baseline migration will fail because the tables exist. Easiest fix: drop and recreate the database, then run the steps above. Seed data is disposable.

### Test accounts (after `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | `admin@creh.com` | `admin` |
| Member | `test@creh.com` | `test` |

Admin access is controlled by the `role` column on `users`, not by email.

New registrations must verify their email before listing items or sending requests. With the default `EMAIL_PROVIDER=console`, the 6-digit code is printed in the API terminal. Seeded accounts are pre-verified.

## Scripts
| Where | Command | What it does |
|---|---|---|
| backend | `npm run dev` | Start API with auto-reload |
| backend | `npm run typecheck` | TypeScript check (also `lint` alias) |
| backend | `npm run migration:run` / `migration:revert` | Apply / roll back migrations |
| backend | `npm run migration:generate -- src/migration/Name` | Generate a migration from entity changes |
| backend | `npm run seed` | Insert sample data |
| frontend | `npm run dev` / `build` / `lint` | Dev server, production build, oxlint |

## API overview
All routes are under `/api`. Everything except register, login, refresh, logout, nearby search and a user's public reviews requires `Authorization: Bearer <token>`. Identity always comes from the token, never from the request body.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify`, `POST /auth/verify/resend` |
| Users | `GET/PATCH /users/me`, `PUT /users/me/location`, `POST /users/me/verify-community` |
| Resources | `GET /resources/nearby?lat&lng&radiusKm&category`, `POST /resources`, `GET /users/me/resources` |
| Requests | `POST /requests`, `GET /users/me/requests`, `POST /requests/:id/{accept,pay,return,review-return}` |
| Chat | `GET/POST /requests/:id/messages` (participants; admins only for disputed exchanges) |
| Reviews | `POST /reviews`, `GET /users/:id/reviews` |
| Admin | `GET /disputes`, `POST /disputes/:id/resolve` |
| Dev only | `POST /resources/seed` (when `ENABLE_DEV_ROUTES=true`) |

Errors use one shape: `{ "error": "message", "details"?: [...] }`.

## Configuration
Backend (`backend/.env`, see `.env.example`): DB settings, **`JWT_SECRET` (required)**, `JWT_EXPIRES_IN` (15m), `REFRESH_TOKEN_TTL_DAYS`, `EMAIL_PROVIDER` (`console` prints verification codes in the API log; `resend` needs `RESEND_API_KEY`), `MAPBOX_ACCESS_TOKEN` (optional, address search), `RATE_LIMIT_ENABLED`, `CORS_ORIGIN`, `ENABLE_DEV_ROUTES`, `LOG_LEVEL`.
Frontend (`frontend/.env`): `VITE_API_URL`, `VITE_MAPBOX_TOKEN`, `VITE_ENABLE_MOCK_FALLBACK`.

### Mock data fallback
When the API is unreachable or returns a 5xx, read-only screens show sample data from `frontend/src/mocks/` with an amber **Demo data** badge. Actions (create, accept, pay...) never fake success. It is on in `npm run dev` and off in production builds unless `VITE_ENABLE_MOCK_FALLBACK=true`.

## Project structure
```text
CREH/
├── SPEC.md                    # Spec-driven development tracker
├── docker-compose.yml         # PostGIS + Redis
├── docs/manual-tests/         # Per-phase manual checklists
├── backend/src/
│   ├── config/                # env loading and validation
│   ├── middleware/            # auth, validation, error handling
│   ├── routes/                # route table
│   ├── controllers/           # thin HTTP handlers
│   ├── services/              # business rules (requests, resources, tokens, verification, users, image storage)
│   ├── adapters/              # third-party seams: email (console/Resend), geocoder (Mapbox/none)
│   ├── schemas/               # Zod request schemas
│   ├── entity/                # TypeORM models
│   ├── migration/             # schema migrations
│   └── seed.ts
└── frontend/src/
    ├── lib/api.ts             # axios instance (auth header, 401 handling)
    ├── stores/authStore.ts    # session state
    ├── mocks/                 # demo-data fixtures + withMockFallback
    ├── components/, pages/
    └── types.ts
```

## Current exchange lifecycle
`PENDING -> ACCEPTED -> ACTIVE -> RETURNED_PENDING_REVIEW -> COMPLETED`, or `-> DISPUTED -> RESOLVED_REFUNDED / RESOLVED_PAID_TO_OWNER`. Each transition is restricted to the right party (owner, requester or admin) and the right current state. This will be reconciled with the PRD state machine in Phase 4.
