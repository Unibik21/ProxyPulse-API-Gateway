FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY dashboard/package.json ./dashboard/package.json
COPY gateway/package.json ./gateway/package.json
COPY analytics-engine/package.json ./analytics-engine/package.json
RUN npm ci --workspace dashboard --include-workspace-root

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV DATABASE_URL=postgresql://gateway:gateway@localhost:5432/gateway_control_plane
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY dashboard ./dashboard
WORKDIR /app/dashboard
RUN npx prisma generate --schema prisma/schema.prisma
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dashboard/public ./dashboard/public
COPY --from=builder /app/dashboard/.next/standalone ./dashboard
COPY --from=builder /app/dashboard/.next/static ./dashboard/.next/static
COPY --from=builder /app/dashboard/prisma ./dashboard/prisma
EXPOSE 3000
WORKDIR /app/dashboard
CMD ["sh", "-c", "npx prisma migrate deploy --schema prisma/schema.prisma && node server.js"]
