# Stage 1: Build wettenbank-mcp
FROM node:20-slim AS wettenbank-builder
WORKDIR /wettenbank
COPY wettenbank-mcp/package*.json ./
RUN npm ci
COPY wettenbank-mcp/tsconfig.json ./
COPY wettenbank-mcp/src/ ./src/
RUN npm run build

# Stage 2: Build mcp-debugger
FROM node:20-slim AS debugger-builder
WORKDIR /app
COPY mcp-debugger/package*.json ./
RUN npm ci
COPY mcp-debugger/tsconfig.json ./
COPY mcp-debugger/src/ ./src/
RUN npm run build

# Stage 3: Runtime
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_SERVER_PATH=/app/wettenbank-mcp/dist/index.js

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=debugger-builder /app/dist ./dist
COPY --from=debugger-builder /app/node_modules ./node_modules
COPY mcp-debugger/public/ ./public/

COPY --from=wettenbank-builder /wettenbank/dist ./wettenbank-mcp/dist
COPY --from=wettenbank-builder /wettenbank/node_modules ./wettenbank-mcp/node_modules

RUN mkdir -p /app/config /app/logs && chown -R app:app /app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s \
  CMD curl -sf http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["node", "dist/server.js"]
