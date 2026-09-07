# Stage 1: Base image with pnpm enabled
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 2: Build client and server
FROM base AS builder
WORKDIR /app

# Copy monorepo manifests for cached dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json apps/api/tsconfig*.json ./apps/api/
COPY apps/web/package.json apps/web/tsconfig*.json apps/web/vite.config.ts ./apps/web/

RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build web frontend and API server
RUN pnpm --filter @mise/web build
RUN pnpm --filter @mise/api build

# Prune production dependencies for the API service
RUN pnpm --filter @mise/api deploy --prod /app/deployed

# Stage 3: Minimal production runner
FROM node:22-alpine AS runner
WORKDIR /app/api

ENV NODE_ENV=production
ENV PORT=3000

# Copy production-ready server and compiled web bundle
COPY --from=builder --chown=node:node /app/deployed /app/api
COPY --from=builder --chown=node:node /app/apps/web/dist /app/web/dist

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.node.js"]
