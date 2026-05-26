# HTTP Response Monitor

BizScout take-home: scheduled httpbin pings, PostgreSQL storage, REST history, SSE dashboard. **Modular monolith** — one backend codebase, deployable as **worker** (ping) or **web** (API) via `APP_ROLE`. Option B (LLM) after core ships.

**Status:** In development · URLs: _TBD_

## Repository structure

```
CT_assessment/
├── backend/          # Node + Express (worker + web roles)
├── frontend/         # React + Vite + TypeScript
└── docker-compose.yml   # local: postgres, redis, worker, web, frontend
```

## Setup

**Prerequisites:** Node 20+, PostgreSQL 15+, Redis, npm/pnpm

| Variable | Worker | Web | Notes |
|----------|--------|-----|--------|
| `APP_ROLE` | `worker` | `web` | Required |
| `DATABASE_URL` | ✓ | ✓ | Shared Postgres |
| `REDIS_URL` | ✓ | ✓ | Pub/sub |
| `PORT` | optional | `3000` | Web serves HTTP/SSE |
| `HTTPBIN_URL` | ✓ | — | Default `https://httpbin.org/anything` |
| `PING_INTERVAL_MS` | ✓ | — | Default `300000` (5 min) |
| `NODE_ENV` | ✓ | ✓ | |

Local: shorter `PING_INTERVAL_MS` in dev only.

```bash
git clone <repository-url> && cd CT_assessment
npm install                    # root or per package — TBD
docker compose up              # postgres + redis + worker + web + frontend
# or: backend with APP_ROLE=worker | web; frontend dev server separately
```

## Architecture

**Modular monolith:** shared `backend/` artifact; **two deploy roles** from the same build.

```
Worker (×1)                    Web (×N)
APP_ROLE=worker                APP_ROLE=web
  scheduler → runPingTick        REST + SSE
  → Postgres                     ↑ subscribe
  → Redis PUBLISH pings:new ─────┘
```

**Tick:** mutex → random JSON POST → httpbin → always insert row → publish `{ id }` (failures included). **`interval_key`** (5-min UTC bucket) UNIQUE on `ping_responses`.

**Pub/sub:** Redis channel `pings:new`. Worker publishes after insert; each web instance subscribes and pushes to its local SSE clients.

**Scale:** worker replicas = 1; web replicas = N. Same image, different env. Take-home may run web ×1.

## Technology choices

| Layer | Choice |
|-------|--------|
| Backend | TypeScript, Node, Express |
| Frontend | React, Vite, TypeScript |
| Database | PostgreSQL + JSONB |
| Real-time | SSE (web); REST for history |
| Messaging | Redis pub/sub |
| Scheduler | `node-cron` (worker only) |
| CI | GitHub Actions — lint, Vitest, coverage on `ping/` |
| Deploy | Railway or Render — Postgres + Redis; services: `api-worker`, `api-web`, static frontend |

Postgres: relational history, `interval_key` constraints, JSONB payloads, one DB for worker and web.

## Assumptions

- Production ping interval **5 minutes**; worker replicas **1**.
- httpbin reachable; failed pings stored as rows.
- No backfill of missed ticks while worker is down.
- SSE reconnect; initial load via REST.
- Option B (LLM agent, incidents) **not in initial scope**.

## Testing strategy

**Core component:** `runPingTick` (payload generator, httpbin client, repository, publish hook).

**Comprehensive:** success + broadcast/publish; failure row + publish; overlapping tick skipped; duplicate `interval_key`.

**Light:** `GET /api/responses`; optional SSE smoke.

**CI:** install → lint → test (coverage emphasis on `backend/` ping module).

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

Index: `created_at DESC`. Migrations in `backend/migrations/`.

## Deployment

1. Postgres + Redis on platform.
2. Deploy **api-worker** (1 replica): `APP_ROLE=worker`, `PING_INTERVAL_MS=300000`.
3. Deploy **api-web** (≥1 replica): `APP_ROLE=web`.
4. Deploy **frontend** with API URL pointing at web service.
5. Run migrations; verify `GET /health` and first ping row.

| Service | URL |
|---------|-----|
| API (web) | _TBD_ |
| Dashboard | _TBD_ |

## Future improvements

- Scale web to N; worker HA (leader lock or managed cron → job endpoint)
- Option B in `backend/` (web role): tool-based agent, token limits, incidents
- Retention, auth, structured metrics
