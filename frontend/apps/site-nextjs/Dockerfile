# syntax=docker/dockerfile:1
# FlexCMS Site (Next.js SSR) — multi-stage Docker build
# Context: frontend/ (the monorepo root)
# Build args:
#   NEXT_PUBLIC_FLEXCMS_API — Author API base URL baked into the client bundle

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/react/package.json packages/react/
COPY apps/site-nextjs/package.json apps/site-nextjs/

RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# ---------------------------------------------------------------------------
# Stage 2: Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/sdk/node_modules ./packages/sdk/node_modules
COPY --from=deps /app/packages/react/node_modules ./packages/react/node_modules
COPY --from=deps /app/apps/site-nextjs/node_modules ./apps/site-nextjs/node_modules

COPY . .

ENV STANDALONE=1
RUN pnpm --filter @flexcms/sdk build && \
    pnpm --filter @flexcms/react build && \
    pnpm --filter @flexcms/site-nextjs build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Default port — override with PORT env var in ECS task definition
ENV PORT=3001

RUN addgroup -S flexcms && adduser -S flexcms -G flexcms

COPY --from=builder --chown=flexcms:flexcms /app/apps/site-nextjs/.next/standalone ./
COPY --from=builder --chown=flexcms:flexcms /app/apps/site-nextjs/.next/static ./apps/site-nextjs/.next/static
COPY --from=builder --chown=flexcms:flexcms /app/apps/site-nextjs/public ./apps/site-nextjs/public

USER flexcms
EXPOSE 3001

CMD ["node", "apps/site-nextjs/server.js"]
