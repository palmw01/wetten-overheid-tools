# Wetten Overheid Tools — MCP Tools

Deze repository bevat de technische tools voor het ontsluiten van Nederlandse wetgeving via het Model Context Protocol (MCP).

## Inhoud

- `wettenbank-mcp/`: De MCP-server (TypeScript). Vier tools: `wettenbank_zoek`, `wettenbank_structuur`, `wettenbank_artikel`, `wettenbank_zoekterm`.
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

Voeg dit toe aan je `.claude/settings.json` of Claude Desktop configuratie:

```json
{
  "mcpServers": {
    "wettenbank": {
      "command": "node",
      "args": ["/absoluut/pad/naar/wettenbank-mcp/dist/index.js"]
    }
  }
}
```

Zie `wettenbank-mcp/README.md` voor volledige documentatie en bekende BWB-ids.

## Licentie
MIT
