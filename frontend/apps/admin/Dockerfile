# syntax=docker/dockerfile:1
# FlexCMS Admin UI — Next.js multi-stage Docker build
# Context: frontend/ (the monorepo root)

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/sdk/package.json packages/sdk/
COPY packages/react/package.json packages/react/
COPY packages/ui/package.json packages/ui/
COPY apps/admin/package.json apps/admin/

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
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules

COPY . .

# Build SDK → React → UI → Admin (dependency order)
ENV STANDALONE=1
RUN pnpm --filter @flexcms/sdk build && \
    pnpm --filter @flexcms/react build && \
    pnpm --filter @flexcms/ui build && \
    pnpm --filter @flexcms/admin build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S flexcms && adduser -S flexcms -G flexcms

COPY --from=builder --chown=flexcms:flexcms /app/apps/admin/.next/standalone ./
COPY --from=builder --chown=flexcms:flexcms /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder --chown=flexcms:flexcms /app/apps/admin/public ./apps/admin/public

USER flexcms
EXPOSE 3000

CMD ["node", "apps/admin/server.js"]

