# ProxyPulse

An API gateway control plane for configuring services, routes, API keys, project teams, and live traffic analytics from one dashboard.

The dashboard is the management layer. The gateway receives client traffic, authenticates API keys, applies rate limits and caching, proxies requests to configured services, and sends request events to the analytics engine. PostgreSQL stores control-plane data and Redis provides gateway state, queues, caching, and analytics storage.

## What it provides

- Organization registration, login, email OTP, password reset, and OAuth hooks
- Projects for separating products or environments
- Service registration with health status and upstream base URLs
- Route configuration with rate limits and optional response caching
- Hashed API keys that are shown only once when created
- Organization invitations with project-specific developer access
- Project-scoped live analytics for latency, popular endpoints, IP reputation, and cache recommendations
- Prometheus metrics from the gateway
- Docker Compose deployment for the complete stack

For Docker image building, Docker Hub publishing, and running the published stack elsewhere, see [DOCKER.md](DOCKER.md).

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

Admins manage projects and organization members. Developers can access only projects they were invited to and are sent directly to their assigned project dashboard.

## Repository layout

| Path | Purpose |
| --- | --- |
| `dashboard/` | Next.js control plane UI, API routes, Prisma schema, and migrations |
| `gateway/` | Fastify reverse proxy, API-key authentication, rate limiting, cache, and metrics |
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

For local development, install:

- Node.js 22 or newer
- npm
- PostgreSQL 16 and Redis 7, or Docker Desktop / Docker Engine with Compose

For production containers, Docker Compose is enough because PostgreSQL and Redis are included in the stack.

## Quick start with Docker

From the repository root:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost:3000 and create an organization. The dashboard container runs the existing Prisma migrations before starting Next.js.

The application images contain code and build output only. Database contents are stored in the local `pgdata` volume and are never pushed to Docker Hub. A new machine pulling the images starts with a fresh database.

Stop the stack while keeping local database data:

```bash
docker compose down
```

Reset local testing and delete all database data:

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

For a remote deployment, set `AUTH_BASE_URL` to the public dashboard URL and `NEXT_PUBLIC_ANALYTICS_WS_URL` to the public WebSocket URL. When PostgreSQL and Redis run in Compose, use the service names `postgres` and `redis`, not `localhost`.

To enable GitHub sign-in, create an OAuth App in GitHub under **Settings → Developer settings → OAuth Apps**. Set the authorization callback URL to:

```text
http://localhost:3000/api/auth/oauth/github/callback
```

For a deployed dashboard, use the same path with the public `AUTH_BASE_URL`, for example `https://dashboard.example.com/api/auth/oauth/github/callback`. Add the OAuth App's client ID and secret as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` environment variables.

## Local development without Docker

Start PostgreSQL and Redis first, then set a local `DATABASE_URL`. From the repository root, install workspace dependencies:

```bash
npm install
```

Run the database migration and generate Prisma Client from the dashboard directory:

```bash
cd dashboard
npx prisma migrate deploy
npx prisma generate
```

Start each application in a separate terminal:

```bash
cd dashboard
npm run dev
```

```bash
cd gateway
npm run dev
```

```bash
cd analytics-engine
npm run dev
```

The gateway defaults to port `7000`, the dashboard to `3000`, and the analytics WebSocket to `8090`.

## Useful commands

```bash
docker compose logs -f dashboard
docker compose logs -f gateway analytics-engine
docker compose restart dashboard
docker compose down
```

Check gateway metrics at http://localhost:7000/metrics and Prometheus at http://localhost:9090.

## Security notes

- Generate a strong, unique `AUTH_SECRET` for every deployment.
- Put the dashboard and WebSocket behind HTTPS/WSS in production.
- Replace the development PostgreSQL password before exposing the stack publicly.
- Keep SMTP credentials and OAuth secrets in runtime environment configuration.
- API keys are hashed in storage and the raw key is returned only at creation time.

### Stack

[![Stack](https://skillicons.dev/icons?i=typescript,javascript,nodejs,nextjs,postgres,redis,docker,git,github)](https://skillicons.dev)