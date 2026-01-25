# Use Bun's official image
FROM oven/bun:1 AS base
WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS dependencies

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# ============================================
# Build Stage
# ============================================
FROM base AS build

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ============================================
# Production Stage
# ============================================
FROM base AS production

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src

# Create logs directory (no user switching for Docker Desktop)
RUN mkdir -p /app/logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run src/health-check.ts || exit 1

LABEL maintainer="gurshaansinghd@gmail.com"
LABEL description="Sentinel - AI-powered container auto-scaling agent"
LABEL version="0.1.0"

CMD ["bun", "run", "start"]