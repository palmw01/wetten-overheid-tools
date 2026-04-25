# Stage 1: Quartz installeren + vault klonen + statische site bouwen
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Quartz v4 installeren
RUN git clone --depth=1 https://github.com/jackyzha0/quartz.git . \
    && npm ci

# Vault-inhoud klonen (publieke repo — geen auth nodig)
RUN rm -rf ./content && git clone --depth=1 https://github.com/palmw01/juridische-analyses.git ./content

# Alleen de specifieke velden in de standaard config patchen
# (volledige vervanging veroorzaakte TypeScript-typefouten)
RUN node -e " \
  const fs = require('fs'); \
  let c = fs.readFileSync('./quartz.config.ts', 'utf8'); \
  c = c.replace(/pageTitle: \"[^\"]*\"/, 'pageTitle: \"Juridische wetsanalyse — Inning\"'); \
  c = c.replace(/baseUrl: \"[^\"]*\"/, 'baseUrl: \"quartz.ipalm.nl\"'); \
  c = c.replace(/locale: \"[^\"]*\"/, 'locale: \"nl-NL\"'); \
  c = c.replace(/ignorePatterns: \[[\s\S]*?\]/, \
    'ignorePatterns: [\".obsidian\",\".claude\",\".git\",\".trash\",\"README.md\",\"CLAUDE.md\",\"settings.json\",\"**\/template.md\"]'); \
  fs.writeFileSync('./quartz.config.ts', c); \
"

# Statische HTML bouwen — fail hard als er geen output is
RUN npx quartz build 2>&1 && \
    test "$(ls -A /app/public 2>/dev/null)" || \
    (echo "FOUT: Quartz build produceerde geen bestanden in /app/public" && exit 1) && \
    echo "=== GEGENEREERDE BESTANDEN ===" && find /app/public -name "*.html" | sort

# Stage 2: Alleen nginx + de gebouwde HTML-bestanden
FROM nginx:alpine
COPY --from=builder /app/public /usr/share/nginx/html
RUN printf 'server {\n    listen 8080;\n    root /usr/share/nginx/html;\n    index index.html;\n    location / { try_files $uri $uri/ /404.html; }\n}\n' \
    > /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget -qO- http://localhost:8080 || exit 1

EXPOSE 8080
