# Wetten Overheid Tools — MCP Tools

Deze repository bevat de technische tools voor het ontsluiten van Nederlandse wetgeving via het Model Context Protocol (MCP).

## Inhoud
- `wettenbank-mcp/`: De MCP-server (TypeScript).
- `mcp-debugger/`: Een lokale debugger en visualisatietool voor de MCP-server.

## Installatie

### MCP Server
```bash
cd wettenbank-mcp
npm install
npm run build
```

### Debugger
```bash
docker-compose up --build
```
De debugger is daarna bereikbaar op `http://localhost:3000`.

## Gebruik in andere projecten
Om deze tools te gebruiken in bijvoorbeeld de `juridische-analyses` repo, voeg je dit pad toe aan je Claude/Gemini instellingen:
`/home/willardp/Documenten/Projecten/wetten-overheid-tools/wettenbank-mcp/dist/index.js`

Of generiek: het absolute pad naar `wettenbank-mcp/dist/index.js` in deze repo.

## Licentie
MIT
