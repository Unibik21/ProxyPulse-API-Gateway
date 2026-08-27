# Build from repo root (npm workspaces monorepo)
FROM node:24-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
RUN npm ci --workspace=gateway

COPY gateway/tsconfig.json ./gateway/
COPY gateway/src ./gateway/src
WORKDIR /app/gateway
RUN npx tsc --outDir dist --rootDir src

FROM node:24-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY gateway/package.json ./gateway/
COPY dashboard/package.json ./dashboard/
COPY analytics-engine/package.json ./analytics-engine/
RUN npm ci --omit=dev --workspace=gateway && npm cache clean --force

COPY --from=builder /app/gateway/dist ./gateway/dist

WORKDIR /app/gateway
USER node
EXPOSE 7000

CMD ["node", "dist/server.js"]
