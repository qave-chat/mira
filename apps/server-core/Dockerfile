# syntax=docker/dockerfile:1.7

# Monorepo context: build from repo root.
#   docker buildx build -f apps/server-core/Dockerfile -t <uri>:<tag> .

FROM --platform=$BUILDPLATFORM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
ENV PNPM_HOME=/pnpm
WORKDIR /app

# ─── fetch: download all deps to the virtual store, keyed on the lockfile ────
FROM base AS fetch
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
RUN pnpm config set store-dir /pnpm/store && pnpm fetch

# ─── deps: offline install for the deployed app graph ────────────────────────
FROM fetch AS deps
COPY package.json ./
COPY apps/client-ui/package.json ./apps/client-ui/
COPY apps/server-core/package.json ./apps/server-core/
COPY packages/client-api/package.json ./packages/client-api/
RUN pnpm install --offline --frozen-lockfile \
    --filter @mira/client-ui... \
    --filter @mira/server-core...

# ─── build-client: produce static Vite assets ────────────────────────────────
FROM deps AS build-client
COPY tsconfig.base.json ./
COPY packages/client-api ./packages/client-api
COPY apps/client-ui ./apps/client-ui
COPY apps/server-core ./apps/server-core
RUN pnpm --filter @mira/client-ui build

# ─── deploy: produce a lean prod-only bundle for server-core ─────────────────
FROM build-client AS deploy
RUN pnpm --filter @mira/server-core deploy --legacy --prod /deploy
RUN mkdir -p /deploy/src/client && cp -R apps/client-ui/dist/. /deploy/src/client/
RUN mkdir -p /deploy/drizzle && \
    if [ -d apps/server-core/drizzle ]; then cp -R apps/server-core/drizzle/. /deploy/drizzle/; fi

# ─── runtime: Bun-only, copies only the deployed bundle ──────────────────────
FROM oven/bun:1.2-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl dnsutils && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 app && useradd -u 1001 -g app -s /bin/bash app

COPY --chown=app:app --from=deploy /deploy ./
USER app

EXPOSE 3000
CMD ["bun", "run", "src/main.ts"]
