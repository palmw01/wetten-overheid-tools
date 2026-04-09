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
| `wettenbank_zoek` | Search by title, rechtsgebied, ministerie, or regelingsoort — returns BWB-id + metadata |
| `wettenbank_artikel` | Fetch one specific article by BWB-id + article number; optional `peildatum` for historical version |
| `wettenbank_zoekterm` | Find which articles in a regulation contain a term; supports wildcard (`termijn*`); returns article list with hit counts and ready-to-use `wettenbank_artikel` calls |

**Data flow (wettenbank_zoek):** builds CQL query → `sruRequest()` hits SRU endpoint → XML parsed → `parseRecords()` + `dedupliceerOpBwbId()` → formatted as markdown.

**Data flow (wettenbank_artikel / wettenbank_zoekterm):** `haalWetstekstOp()` fetches regulation via SRU, then fetches full XML from `repository.officiele-overheidspublicaties.nl/bwb/`. For `wettenbank_artikel`, `extraheerArtikelUitXml()` extracts the article via DOM-traversal; optional `N.M`-notation (`artikel="9.1"`) activates a lid-filter via `parseerArtikelParam()`. Header uses `extraheerDocMetadata()` for citeertitel + versiedatum; `detecteerArtikelStatus()` adds a ⚠️-warning for vervallen articles; `bouwJciUri()` appends the Bronreferentie. For `wettenbank_zoekterm`, `zoekTermInArtikelDom()` groups matches per article node from the XML DOM (not from plain text).

### `wettenbank_zoekterm` — wildcard

Zoekterm die eindigt op `*` wordt omgezet naar een regex-suffix `\w*` via `bouwTermPatroon()`: `termijn*` → matcht `termijn`, `termijnen`, `termijnoverschrijding`. Speciale tekens worden vooraf geescapet via `escapeerRegex()`.

### XML-schemas als ontwerpbasis

De server laadt geen XSD's op en valideert er niet mee, maar twee publieke schemas van `repository.officiele-overheidspublicaties.nl` vormen de stille blauwdruk achter de parselogica:

**`BWB-toestand/2016-1` (`toestand_2016-1.xsd`)** — beschrijft de XML-structuur van wetsdocumenten die het repository serveert. Hierop is gebaseerd:
- De `isArray`-lijst in `wetParser`: elementen met `maxOccurs="unbounded"` in de XSD (`artikel`, `lid`, `li`, `circulaire.divisie`, enz.) moeten als array worden geparsed, anders breekt de DOM-traversal bij enkelvoudige kinderen.
- De structurele containers in `zoekArtikelInDom`: `boek`, `deel`, `hoofdstuk`, `afdeling`, `paragraaf`, `wettekst`, `wetgeving` zijn XSD-elementnamen.
- De veldnamen in `formateerArtikelNode`: `kop`, `nr`, `al`, `lid`, `lidnr`, `lijst`, `li`, `tekst`.

**`BWB-WTI/2016-1` (`wti_2016-1.xsd`)** — beschrijft de recordstructuur die de SRU-zoekdienst teruggeeft. De padnamen in `parseRecords()` zijn WTI-XSD-elementen en namespaces:
```
gzd → originalData → overheidbwb:meta → owmskern (dcterms:*, overheid:*)
                                       → bwbipm (overheidbwb:*)
      enrichedData → overheidbwb:locatie_toestand
```

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
