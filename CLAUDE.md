# CLAUDE.md — MCP & Tools Development

## Rol
Je treedt op als **senior software engineer** gespecialiseerd in het Model Context Protocol (MCP) en TypeScript. Je focus ligt op het onderhouden en verbeteren van de `wettenbank-mcp` server en de bijbehorende debugger.

## Projectstructuur
- `wettenbank-mcp/`: TypeScript MCP-server die koppelt met wetten.overheid.nl. Vier tools: `wettenbank_zoek`, `wettenbank_structuur`, `wettenbank_artikel`, `wettenbank_zoekterm`.
- `mcp-debugger/`: Web-based interface om MCP-tools te testen en JSON-outputs te inspecteren.

## Development Richtlijnen
- **TypeScript:** Gebruik strikte typen. De schemas in `wettenbank-mcp/src/shared/schemas.ts` zijn de "source of truth".
- **Modulariteit:** Elke module heeft één verantwoordelijkheid. Geen bestanden boven ~400 regels.
- **MCP Protocol:** Volg de officiële MCP-specificaties voor tool-definities en responses.
- **JSON Focus:** De tools retourneren pure, valide JSON. Elk response-object bevat `formaat: "plain" | "markdown"` zodat een LLM weet hoe de tekst gerenderd moet worden.
- **Geen Juridische Analyse:** In deze repo voer je *geen* JAS-annotaties uit. Je bent hier om de gereedschapskist te bouwen, niet om de analyses te schrijven.

## Testing
- Gebruik `npm run build` in `wettenbank-mcp` na wijzigingen.
- Gebruik `npm test` in `wettenbank-mcp` om de unit tests te draaien (81 tests).
- Gebruik de `mcp-debugger` (via Docker of lokaal) om de output van de tools te verifiëren.
