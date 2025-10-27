# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY app/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install tsx globally for running TypeScript
RUN npm install -g tsx

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY app/package*.json ./
COPY app/src ./src
COPY app/scripts ./scripts
COPY app/tsconfig.json ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy .env.example as template
COPY .env.example /app/.env.example

# Set default environment variables
ENV PORT=3000 \
    HOST=0.0.0.0 \
    DEMO_ALLOW_ALL=false \
    CSV_DEFAULT_SEP=, \
    RATE_LIMIT_WINDOW_MS=900000 \
    RATE_LIMIT_MAX=100

# Expose port (Railway will override with $PORT)
EXPOSE 3000

# Health check (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["tsx", "src/server.ts"]
