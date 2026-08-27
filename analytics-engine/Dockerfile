# Build from repo root (npm workspaces monorepo)
FROM node:24-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
RUN npm ci --workspace=analytics-engine

COPY analytics-engine/tsconfig.json ./analytics-engine/
COPY analytics-engine/src ./analytics-engine/src
WORKDIR /app/analytics-engine
RUN npx tsc --outDir dist --rootDir src

FROM node:24-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
RUN npm ci --omit=dev --workspace=analytics-engine && npm cache clean --force

COPY --from=builder /app/analytics-engine/dist ./analytics-engine/dist

WORKDIR /app/analytics-engine
USER node
EXPOSE 8090

CMD ["node", "dist/index.js"]
