FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/package.json
COPY dashboard/package.json ./dashboard/package.json
COPY analytics-engine/package.json ./analytics-engine/package.json
RUN npm ci --workspace gateway --include-workspace-root

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY gateway ./gateway
WORKDIR /app/gateway
RUN npm run typecheck
RUN npx tsc --outDir dist

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/gateway/package.json ./package.json
COPY --from=builder /app/gateway/dist ./dist
EXPOSE 7000
CMD ["node", "dist/server.js"]
