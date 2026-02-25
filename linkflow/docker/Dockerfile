# Multi-stage Docker build for LinkFlow
# Requires Node.js 24+ (node:sqlite built-in)

# Stage 1: Dependencies
FROM node:24-alpine AS dependencies
WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/
COPY packages/types/package.json ./packages/types/

RUN npm ci

# Stage 2: Builder
FROM node:24-alpine AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Production
FROM node:24-alpine AS production
WORKDIR /app

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy workspace manifests for production install
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/mcp-server/package.json ./apps/mcp-server/
COPY packages/plugin-sdk/package.json ./packages/plugin-sdk/
COPY packages/types/package.json ./packages/types/

RUN npm ci --omit=dev

# Copy built Next.js app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js

# Create data and plugins dirs
RUN mkdir -p ./data ./plugins && chown -R nextjs:nodejs ./data ./plugins

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/linkflow.db

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/node_modules/.bin/next", "start", "apps/web", "-p", "3000"]
