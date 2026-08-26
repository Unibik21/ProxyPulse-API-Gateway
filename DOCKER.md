# Docker and Docker Hub

This guide covers building the API Gateway Control Plane images, publishing them to Docker Hub, and running the published stack on another machine.

## Prerequisites

Install Docker Desktop or Docker Engine with the Compose plugin. From the repository root, verify the installation:

```bash
docker --version
docker compose version
```

## Docker Compose services

The Compose stack includes:

- `dashboard`: Next.js control plane on port `3000`
- `gateway`: Fastify API gateway on port `7000`
- `analytics-engine`: project-scoped analytics WebSocket on port `8090`
- `postgres`: PostgreSQL database
- `redis`: gateway and analytics state
- `prometheus`: metrics server on port `9090`

## Local Docker run

Create a root `.env` file if you want to override the development defaults:

```env
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ANALYTICS_WS_URL=ws://localhost:8090
```

Build and start the complete stack:

```bash
docker compose up -d --build
docker compose ps
```

Open http://localhost:3000. The dashboard container runs `prisma migrate deploy` before starting Next.js.

The application images contain code and build output only. PostgreSQL data is stored in the named `pgdata` volume and is not included in images or pushed to Docker Hub. A new machine starts with a fresh database.

Stop the stack and keep local database data:

```bash
docker compose down
```

Reset local testing and delete all local database data:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
```

## Build images

Set your Docker Hub username and release tag:

```bash
export DOCKERHUB_USERNAME=yourdockerhubuser
export IMAGE_TAG=1.0.0
```

Build the three application images:

```bash
docker compose build dashboard gateway analytics-engine
```

The image names are:

```text
yourdockerhubuser/api-gateway-dashboard:1.0.0
yourdockerhubuser/api-gateway-gateway:1.0.0
yourdockerhubuser/api-gateway-analytics:1.0.0
```

## Publish to Docker Hub

Create these three repositories on Docker Hub:

- `api-gateway-dashboard`
- `api-gateway-gateway`
- `api-gateway-analytics`

Log in and push the tagged images:

```bash
docker login
docker compose push dashboard gateway analytics-engine
```

To publish a `latest` tag as well:

```bash
export IMAGE_TAG=latest
docker compose build dashboard gateway analytics-engine
docker compose push dashboard gateway analytics-engine
```

Do not publish `.env`, database credentials, SMTP passwords, OAuth secrets, `AUTH_SECRET`, or the `pgdata` volume. Publish only the three application images. Never use `docker commit` on a database container.

## Run published images elsewhere

Copy these files to the deployment machine:

- `docker-compose.yml`
- `prometheus.yml`
- A production `.env` file

Set the image owner and tag:

```env
DOCKERHUB_USERNAME=yourdockerhubuser
IMAGE_TAG=1.0.0
AUTH_SECRET=replace-with-a-long-random-secret
AUTH_BASE_URL=https://dashboard.example.com
NEXT_PUBLIC_ANALYTICS_WS_URL=wss://analytics.example.com
```

For a Compose deployment, keep internal service connection values pointed at `postgres`, `redis`, and `dashboard` rather than `localhost`. Then pull and start the stack:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Expose ports `3000`, `7000`, and `8090` only as needed, and use a reverse proxy with TLS for public deployments. The browser-facing analytics URL must use `wss://` when the dashboard is served over HTTPS.

## Useful Docker commands

```bash
docker compose logs -f dashboard
docker compose logs -f gateway analytics-engine
docker compose restart dashboard
docker compose down
```
