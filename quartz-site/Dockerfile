# Stage 1: Quartz installeren + vault klonen + statische site bouwen
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Quartz v4 installeren
RUN git clone --depth=1 https://github.com/jackyzha0/quartz.git . \
    && npm ci

# Vault-inhoud klonen (publieke repo — geen auth nodig)
# Quartz maakt content/ al aan bij npm ci; verwijder eerst
RUN rm -rf ./content && git clone --depth=1 https://github.com/palmw01/juridische-analyses.git ./content

# Onze configuratie over de standaard heen leggen
COPY quartz-site/quartz.config.ts ./quartz.config.ts

# Statische HTML bouwen
RUN npx quartz build

# Stage 2: Alleen nginx + de gebouwde HTML-bestanden
FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
RUN printf 'server {\n    listen 3000;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / { try_files $uri $uri/ /404.html; }\n}\n' \
    > /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost || exit 1

EXPOSE 80
