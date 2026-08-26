FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY analytics-engine/package.json ./analytics-engine/package.json
COPY gateway/package.json ./gateway/package.json
COPY dashboard/package.json ./dashboard/package.json
RUN npm ci --workspace analytics-engine --include-workspace-root

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY analytics-engine ./analytics-engine
WORKDIR /app/analytics-engine
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app/analytics-engine
ENV NODE_ENV=production
COPY --from=builder /app/analytics-engine/package.json ./package.json
COPY --from=builder /app/analytics-engine/dist ./dist
EXPOSE 8090
CMD ["node", "dist/index.js"]
