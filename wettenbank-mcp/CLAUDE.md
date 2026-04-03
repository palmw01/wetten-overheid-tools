# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript → dist/
npm run dev        # Run directly with tsx (no build needed)
npm start          # Run compiled server: node dist/index.js
npm test           # Run unit tests (vitest)
npm run test:watch # Watch mode
```

Unit tests staan in `src/index.test.ts` (vitest). Alle geëxporteerde functies zijn gedekt. Draai `npm test` voor een commit.

## Architecture

This is a **Model Context Protocol (MCP) server** that gives Claude Desktop access to Dutch legislation via the public SRU API at `zoekservice.overheid.nl`. No API key required — data is CC-0.

The entire server lives in `src/index.ts`. It exposes three tools:

| Tool | Purpose |
|------|---------|
| `wettenbank_zoek` | Search by title, rechtsgebied, ministerie, or regelingsoort; two-step full-text search when both `titel` and `trefwoord` are given |
| `wettenbank_ophalen` | Fetch full text of a regulation by BWB-id; optional `artikel` to fetch one specific article directly (bypasses 50KB limit), optional `zoekterm` to find occurrences within the text |
| `wettenbank_wijzigingen` | List regulations changed since a given date |

**Data flow:** Claude calls a tool → tool handler builds a CQL query → `sruRequest()` hits the SRU endpoint → XML parsed with `fast-xml-parser` → `parseRecords()` extracts `Regeling` objects → formatted as markdown and returned to Claude.

For `wettenbank_ophalen`, there's an extra step: after finding the regulation via SRU, it fetches the full XML from `repository.officiele-overheidspublicaties.nl/bwb/` and strips it to plain text via `stripXml()`. When `artikel` is given, only that article's XML node is extracted before stripping, keeping the response small regardless of regulation size.

### `wettenbank_zoek` — zoekgedrag

| Parameters | Gedrag |
|------------|--------|
| alleen `titel` | CQL: `overheidbwb.titel any "…"` |
| alleen `trefwoord` | CQL: `cql.anywhere any "…"` (alle geïndexeerde velden) |
| `titel` + `trefwoord` samen | Twee-staps: wet ophalen op titel → volledige tekst downloaden → trefwoord zoeken met context-fragmenten |

> **Let op:** gebruik `titel` + `trefwoord` nooit samen als enkelvoudige CQL-query — dit was een bug die een ongeldige query en HTTP 500 veroorzaakte. De twee-staps aanpak omzeilt dit correct.

### `wettenbank_ophalen` — artikel en zoekterm

Optionele parameter `artikel`: geeft uitsluitend het gevraagde artikel terug (bijv. `"3:40"` voor Awb, `"25"` voor IW 1990). Efficiënter dan de volledige wet ophalen en werkt ook voor artikelen voorbij de 50KB-grens.

Optionele parameter `zoekterm`: na het ophalen van de wetstekst worden alle vindplaatsen (max. 10 fragmenten van ±150 tekens context) teruggegeven.

**Communication:** StdIO — Claude Desktop launches the server as a subprocess and exchanges JSON over stdin/stdout via `StdioServerTransport`.

## Deployment

**Claude Desktop** — add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "wettenbank": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"]
    }
  }
}
```

**Claude Code CLI** — add to `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "mcpServers": {
    "wettenbank": {
      "command": "node",
      "args": ["/absolute/path/to/wettenbank-mcp/dist/index.js"]
    }
  }
}
```
