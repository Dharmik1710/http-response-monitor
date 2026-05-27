# HTTP Response Monitor

Scheduled httpbin pings stored in Postgres + a REST history API + an SSE dashboard.

## Repository structure

```
CT_assessment/
├── backend/              # Node/Express + Prisma + Redis pub/sub
├── frontend/             # React/Vite dashboard
└── docker-compose.yml   # local: Postgres + Redis
```

## Local setup

Prereqs: `node` 20+, `docker`, `npm`

```bash
git clone <repository-url> && cd CT_assessment
docker compose up -d
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cd backend && npm ci && npm run dev
cd ../frontend && npm ci && npm run dev
```

- Backend API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

For faster local iteration, `PING_INTERVAL_MS` is set to `30000` in `backend/.env`.

## Architecture

One `backend/` codebase. Runtime role is selected with **`APP_ROLE`**:

| Mode | `APP_ROLE` | What runs |
|------|------------|-----------|
| **Monolith** (default, local + Render) | `monolith` | Scheduler + httpbin ping + Postgres write + Redis publish **and** REST + SSE in **one process** |
| **Worker** (scale path) | `worker` | Ping scheduler only |
| **Web** (scale path) | `web` | REST + SSE only |

**Ping tick:** mutex → random JSON POST → httpbin → always insert row (success or failure) → Redis `PUBLISH pings:new` with `{ id }`. **`interval_key`** is a 5-minute UTC bucket with a UNIQUE constraint for idempotency.

**Live updates:** Redis channel `pings:new`. After insert, subscribers load the row by id and push to connected SSE clients. REST loads history; SSE prepends new rows on page 1 only.

### Current deployment (monolith)

- **Frontend (React/Vite)**: static app; calls REST (`/api/responses`) for history and opens SSE (`/api/events`) for live rows.
- **API (Express, `APP_ROLE=monolith`)**: serves REST + SSE and runs the scheduler in the same process (default on Render).
- **Scheduler (`node-cron`)**: triggers `runPingTick` every `PING_INTERVAL_MS`.
- **Ping runner (`runPingTick`)**: POSTs random JSON to httpbin, records result, publishes `{ id }` to Redis.
- **Database (Postgres via Prisma)**: stores `ping_responses` rows (including failures) with UNIQUE `interval_key` buckets.
- **Messaging (Redis pub/sub)**: `pings:new` fan-out; the API subscribes and broadcasts new rows to SSE clients.

### Scale path (split roles; same Docker image)

```
Worker (×1)                         Web (×N)
APP_ROLE=worker                     APP_ROLE=web
  scheduler → runPingTick             REST /api/responses
  → Prisma → Postgres                 SSE /api/events
  → Redis PUBLISH pings:new ─────────→ Redis SUBSCRIBE → clients
```

Run exactly **one** worker to avoid duplicate schedules. Scale the web role horizontally; Redis pub/sub ensures every web replica can push live updates to its connected clients.

## Tech stack

| Layer | Choice |
|-------|--------|
| Backend | TypeScript, Node 20, Express |
| ORM | Prisma (`backend/prisma/schema.prisma`) |
| Frontend | React 18, Vite, TypeScript |
| Database | PostgreSQL (JSONB payloads) |
| Cache / messaging | Redis pub/sub (`pings:new`) |
| Real-time | Server-Sent Events (SSE); REST for paginated history |
| Scheduler | `node-cron` (worker / monolith roles) |
| HTTP client | `fetch` to httpbin |
| Logging | pino |
| Tests | Vitest (unit + integration) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Deploy | Render Blueprint (`render.yaml`) — Postgres, Redis, API, static frontend |

## Tradeoffs

| Decision | Choice | Why |
|----------|--------|-----|
| **Modular monolith vs microservices** | One backend repo, role via env | Faster to build and deploy; can split to worker/web later without rewriting domain logic |
| **Monolith on Render vs split worker/web** | `APP_ROLE=monolith` in production today | One free web service, simpler ops; split when you need horizontal SSE/API scale |
| **Prisma `db push` vs migrations** | `prisma db push` on container start | Zero manual migration step on deploy; acceptable for demo — use `prisma migrate` for stricter production change control |
| **HTTP (REST) vs SSE vs WebSockets** | REST for history + SSE for live | REST is ideal for paginated queries; SSE is lightweight server→client push for new rows. WebSockets would add bidirectional complexity we don’t need. |
| **Redis pub/sub vs polling** | Pub/sub | Multiple web replicas can each subscribe; no DB polling for live events |
| **`interval_key` UNIQUE** | 5-min UTC bucket | Prevents duplicate rows if ticks overlap or a replica mis-fires |
| **Failed pings as rows** | Always persist | Dashboard shows failures; history is complete |
| **Render free tier** | $0 demo | API may sleep when idle (cold start); free Postgres has a 30-day limit — upgrade for long-lived production |
| **Deploy after CI** | GitHub Actions gates deploy hooks | Broken `main` does not auto-replace a healthy deployment; optional Render “After CI checks pass” instead of hooks (pick one, not both) |
| **Config** | `VITE_API_URL` + `FRONTEND_URL` | No hardcoded hosts; CORS locked to the real frontend origin in production |

## Assumptions

- Production ping interval **5 minutes**
- httpbin reachable; failed pings stored as rows.
- No backfill of missed ticks while worker is down.
- SSE reconnect; initial load via REST.
- Option B (LLM agent, incidents) **not in initial scope**.

## Testing

| Scope | What runs | Location |
|-------|-----------|----------|
| **Unit** | `runPingTick`, payload generator, httpbin client, route handlers (mocked DB/Redis) | `backend/tests/unit/` |
| **Integration** | Prisma repository against real Postgres (CI service container) | `backend/tests/integration/` |
| **Frontend** | Components + `usePings` hook | `frontend/tests/unit/` |

**`runPingTick` cases:** success path + publish; failure row + publish; overlapping tick skipped (mutex); duplicate `interval_key` rejected.

**CI (on PR and push to `main`):** backend build + unit tests; integration tests (Postgres + Redis); `tsc` backend/frontend; frontend tests + production build.

```bash
cd backend && npm test && npm run test:integration
cd frontend && npm test
```

## Database schema

**`ping_responses`**

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `interval_key` | TIMESTAMPTZ UNIQUE |
| `created_at` | TIMESTAMPTZ |
| `request_payload` | JSONB |
| `response_status` | INT nullable |
| `response_body` | JSONB |
| `response_body_truncated` | BOOLEAN default false |
| `latency_ms` | INT nullable |
| `success` | BOOLEAN |
| `error_message` | TEXT nullable |

Index: `created_at DESC`. Schema managed with Prisma (`backend/prisma/schema.prisma`); production applies via `prisma db push` in `docker-entrypoint.sh`.

## Deployment

**Platform:** [Render](https://render.com) — Blueprint from `render.yaml` provisions Postgres, Redis, monolith API (Docker), and static frontend.

| | URL |
|---|-----|
| Dashboard | https://http-monitor-frontend.onrender.com |
| API health | https://http-monitor-api.onrender.com/api/health |

**Why Render:** one Blueprint defines infra as code; free tier is enough for a reviewer demo. Tradeoff: free web services spin down after idle (30–60s cold start); free Postgres expires after ~30 days.

**`render.yaml`:** service names, `plan: free`, `PING_INTERVAL_MS=300000`, internal Redis (`ipAllowList: []`), `VITE_API_URL` wired to the API URL at frontend build time. Set **`FRONTEND_URL`** on the API (CORS) to the dashboard origin after first deploy.

**CI → deploy (recommended setup):**

1. GitHub Actions runs tests on every PR and push to `main`.
2. On push to `main` only: deploy job runs if `DEPLOY_ENABLED=true`.
3. Actions POST **Render deploy hooks** for API + frontend (keep Render **Auto-Deploy off**, or use **Auto-Deploy: After CI checks pass** — not both).
4. Workflow polls `/api/health` before marking the GitHub **production** deployment successful.

## Future improvements

**Scale & reliability**

- Split `APP_ROLE` to **worker ×1** + **web ×N** behind the same Docker image; Redis pub/sub already supports multiple SSE nodes.
- Worker HA: distributed lock (Redis/Postgres advisory lock) or external scheduler (Render cron → `POST /internal/tick`) so only one tick runs globally.
- Replace `db push` with versioned **`prisma migrate`** in CI and `migrate deploy` in entrypoint for safe schema evolution.
- Backfill or gap detection when the worker was down (optional cron reconciliation job).

**Product & API**

- Retention policy (partition or archive `ping_responses` by `created_at`).
- AuthN/AuthZ on REST + SSE (API keys or session cookies; tighten CORS).
- Structured metrics (Prometheus/OpenTelemetry): tick duration, httpbin error rate, SSE client count, Redis lag.

**Real-time & UX**

- WebSocket fallback where SSE is blocked; or long-poll fallback.
- Alerting when N consecutive pings fail; webhook/email integration.
