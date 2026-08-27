# Build from repo root (npm workspaces monorepo)
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
RUN npm ci --workspace=dashboard

COPY dashboard/ ./dashboard/
WORKDIR /app/dashboard

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_ANALYTICS_WS_URL=ws://localhost:8090
ENV DATABASE_URL=postgresql://gateway:gateway@postgres:5432/gateway_control_plane
RUN npx prisma generate && npm run build

FROM node:24-alpine AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
# Keep full deps (incl. dev) so the Prisma CLI is available for `migrate deploy`.
RUN npm ci --workspace=dashboard && npm cache clean --force

# Last build stage regenerated the Prisma client into the monorepo node_modules;
# copy that generated client into this clean node_modules.
RUN npx --prefix /app/dashboard prisma generate || true

COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./dashboard/.next/static
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/prisma ./dashboard/prisma
COPY --from=builder /app/dashboard/prisma.config.ts ./dashboard/prisma.config.ts

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

WORKDIR /app/dashboard
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
