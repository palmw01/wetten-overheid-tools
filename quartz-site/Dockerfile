# Stage 1: Quartz installeren en bouwen
FROM node:20-slim AS builder
WORKDIR /app

# Quartz v4 ophalen
RUN npx --yes quartz@latest create --directory /app --strategy empty 2>/dev/null || true
COPY quartz-site/quartz.config.ts ./quartz.config.ts
COPY quartz-site/quartz.layout.ts ./quartz.layout.ts

# Stage 2: Runtime
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Europe/Amsterdam
ENV PORT=8080

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system app && adduser --system --ingroup app app

COPY --from=builder /app ./
RUN mkdir -p /app/content /app/public /app/logs && chown -R app:app /app

USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -sf http://127.0.0.1:8080 || exit 1

EXPOSE 8080

# content/ wordt als volume gemount vanuit de vault op de host
CMD ["npx", "quartz", "build", "--serve", "--port", "8080"]
