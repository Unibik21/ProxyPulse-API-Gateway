# ProxyPulse

An API gateway with an actual control plane behind it, instead of a config file you have to SSH in to edit.

The dashboard is where you configure things — services, routes, API keys, who's on your team. The gateway is a separate process that sits in front of your real traffic, checks API keys, enforces rate limits, serves cached responses, and proxies everything else through to whatever you've registered. Every request it handles gets logged to an analytics engine, which crunches that into latency numbers, popular endpoints, and IP reputation, then pushes it to the dashboard over a WebSocket so you're not refreshing a page to see what's happening.

Postgres holds the control-plane data (orgs, projects, routes, users). Redis handles everything the gateway needs at request time — rate limit counters, cache, the log queue the analytics engine drains.

[![Stack](https://skillicons.dev/icons?i=typescript,javascript,nodejs,nextjs,postgres,redis,docker,git,github)](https://skillicons.dev)

## Contents

- [What it provides](#what-it-provides)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Repository layout](#repository-layout)
- [Service endpoints](#service-endpoints)
- [Requirements](#requirements)
- [Quick start with Docker](#quick-start-with-docker)
- [Configuration](#configuration)
- [Local development without Docker](#local-development-without-docker)
- [Useful commands](#useful-commands)
- [Security notes](#security-notes)

## What it provides

- Organization registration, login, email OTP, password reset, and OAuth hooks
- Projects, so you're not mixing staging routes in with production ones
- Service registration with health status and upstream base URLs
- Route configuration — rate limits and optional response caching per route, no redeploy needed to change either
- API keys that are hashed at rest and shown to you exactly once, at creation
- Org invitations that give someone access to a specific project, not your whole org
- Live analytics per project: latency, most-hit endpoints, IP reputation, cache hit-rate recommendations
- Prometheus metrics from the gateway (`/metrics`)
- The whole thing comes up with one `docker compose up`

Docker image building, Docker Hub publishing, and running the published stack elsewhere are covered separately in [DOCKER.md](DOCKER.md).

## Screenshots
<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/dashboard-overview.png" alt="Dashboard overview" width="100%" />
      <br /><sub>Dashboard — services and routes for a project</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/live-analytics.png" alt="Live analytics view" width="100%" />
      <br /><sub>Live analytics, pushed over WebSocket</sub>
    </td>
  </tr>

  <tr>
    <td width="50%">
      <img src="docs/screenshots/route-config.jpeg" alt="Route configuration" width="100%" />
      <br /><sub>Creating Routes</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/api-key-generation.png" alt="API key generation" width="100%" />
      <br /><sub>A freshly generated key — shown once, then gone</sub>
    </td>
  </tr>
</table>

## Architecture

![architecture](final.png)

The data hierarchy is:

```text
Organization
   └── Project
          ├── Services
          │    └── Routes
          ├── Project members
          └── Project analytics
```

Admins manage projects and org members. Developers only see projects they've been invited to, and land directly in that project's dashboard on login.

## Repository layout

| Path | Purpose |
| --- | --- |
| `dashboard/` | Next.js control plane UI, API routes, Prisma schema, and migrations |
| `gateway/` | Fastify reverse proxy, API-key auth, rate limiting, cache, and metrics |
| `analytics-engine/` | Redis-backed event consumer and project-scoped WebSocket analytics |
| `docker-compose.yml` | Local and container deployment for all services and dependencies |
| `prometheus.yml` | Prometheus scrape configuration |

## Service endpoints

| Service | Container port | Local URL |
| --- | ---: | --- |
| Dashboard | 3000 | http://localhost:3000 |
| Gateway | 7000 | http://localhost:7000 |
| Analytics WebSocket | 8090 | ws://localhost:8090 |
| PostgreSQL | 5432 | localhost:5433 |
| Redis | 6379 | localhost:6969 |
| Prometheus | 9090 | http://localhost:9090 |

## Requirements

For local development:

- Node.js 22 or newer
- npm
- PostgreSQL 16 and Redis 7, or Docker Desktop / Docker Engine with Compose

For production containers, Docker Compose is enough — Postgres and Redis are already part of the stack.

## Quick start with Docker

From the repository root:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost:3000 and create an organization. The dashboard container runs the existing Prisma migrations before Next.js starts, so there's no separate migration step for a fresh stack.

The application images contain code and build output only — database contents live in the local `pgdata` volume and never get pushed to Docker Hub. A new machine pulling the images starts with an empty database.

Stop the stack, keep the data:

```bash
docker compose down
```

Wipe everything and start clean:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

## Configuration

Create a root `.env` file for local overrides:

```env
DOCKERHUB_USERNAME=yourdockerhubuser
IMAGE_TAG=latest
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://gateway:gateway@postgres:5432/gateway_control_plane
NEXT_PUBLIC_ANALYTICS_WS_URL=ws://localhost:8090
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

For a remote deployment, point `AUTH_BASE_URL` at the public dashboard URL and `NEXT_PUBLIC_ANALYTICS_WS_URL` at the public WebSocket URL. When Postgres and Redis run in Compose, use the service names `postgres` and `redis` — not `localhost`.

To enable GitHub sign-in, create an OAuth App under **Settings → Developer settings → OAuth Apps** in GitHub, with the authorization callback URL set to:

```text
http://localhost:3000/api/auth/oauth/github/callback
```

For a deployed dashboard, same path, public `AUTH_BASE_URL` — e.g. `https://dashboard.example.com/api/auth/oauth/github/callback`. Set the resulting client ID and secret as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

## Local development without Docker

Start Postgres and Redis first, then set a local `DATABASE_URL`. From the repo root:

```bash
npm install
```

Run migrations and generate the Prisma client from the dashboard directory:

```bash
cd dashboard
npx prisma migrate deploy
npx prisma generate
```

Then start each app in its own terminal:

```bash
cd dashboard && npm run dev
```

```bash
cd gateway && npm run dev
```

```bash
cd analytics-engine && npm run dev
```

Gateway defaults to port `7000`, dashboard to `3000`, analytics WebSocket to `8090`.

## Useful commands

```bash
docker compose logs -f dashboard
docker compose logs -f gateway analytics-engine
docker compose restart dashboard
docker compose down
```

Gateway metrics: http://localhost:7000/metrics — Prometheus: http://localhost:9090

## Security notes

- Generate a unique `AUTH_SECRET` per deployment, don't reuse one across environments.
- Put the dashboard and WebSocket behind HTTPS/WSS in production.
- Replace the development Postgres password before exposing the stack publicly.
- Keep SMTP credentials and OAuth secrets in runtime env config, not in the repo.
- API keys are hashed at rest — the raw value is shown once at creation and can't be recovered after. Lost key, new key.
