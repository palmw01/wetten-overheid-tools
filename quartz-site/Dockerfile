FROM node:20-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl git \
    && rm -rf /var/lib/apt/lists/*

# Quartz v4 installeren via git clone (officiële installatiemethode)
RUN git clone --depth=1 https://github.com/jackyzha0/quartz.git . \
    && npm ci

# Onze site-configuratie over de standaard heen leggen
COPY quartz-site/quartz.config.ts ./quartz.config.ts

RUN addgroup --system app && adduser --system --ingroup app app \
    && mkdir -p /app/content /app/public /app/logs \
    && chown -R app:app /app

USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -sf http://127.0.0.1:8080 || exit 1

EXPOSE 8080

# content/ wordt als volume gemount vanuit de vault op de NAS
CMD ["npx", "quartz", "build", "--serve", "--port", "8080"]
