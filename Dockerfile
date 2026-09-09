# Stage 1: Build client and server
FROM node:22-alpine AS builder
WORKDIR /app

# Copy monorepo manifests for cached dependency installation
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json apps/api/tsconfig*.json ./apps/api/
COPY apps/web/package.json apps/web/tsconfig*.json apps/web/vite.config.ts ./apps/web/

RUN npm ci

# Copy source files
COPY packages/ ./packages/
COPY apps/ ./apps/

# Build web frontend and API server
RUN npm run build --workspace=@mise/web
RUN npm run build --workspace=@mise/api

# Stage 2: Minimal production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root manifests and workspace manifests for production install
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/contracts/package.json ./packages/contracts/
COPY apps/api/package.json ./apps/api/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built artifacts and contracts source
COPY --from=builder --chown=node:node /app/packages/contracts/src ./packages/contracts/src
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/web/dist ./apps/web/dist

USER node
WORKDIR /app/apps/api
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.node.js"]

