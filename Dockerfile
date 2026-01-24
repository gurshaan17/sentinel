# Use Bun's official image
FROM oven/bun:1 AS base

WORKDIR /app

# ============================================
# Dependencies Stage
# ============================================
FROM base AS dependencies

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================
# Build Stage
# ============================================
FROM base AS build

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build TypeScript
RUN bun run build

# ============================================
# Production Stage
# ============================================
FROM base AS production

# Install production dependencies only
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src

# Create non-root user for security
RUN groupadd -r sentinel -g 1001 && \
    useradd -r -u 1001 -g sentinel sentinel

# Create logs directory
RUN mkdir -p /app/logs && chown -R sentinel:sentinel /app

# Switch to non-root user
USER sentinel

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run src/health-check.ts || exit 1

# Metadata
LABEL maintainer="gurshaansinghd@gmail.com"
LABEL description="Sentinel - AI-powered container auto-scaling agent"
LABEL version="0.1.0"

# Run the application
CMD ["bun", "run", "start"]