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

The server lives in `src/index.ts` (gateway + business logic). Zod-schemas in `src/shared/schemas.ts`. XML parsing and formatting is handled by the `src/bwb-parser/` module. It exposes three tools:

| Tool | Purpose |
|------|---------|
| `wettenbank_zoek` | Search by title, rechtsgebied, ministerie, or regelingsoort — returns JSON with `regelingen` array |
| `wettenbank_artikel` | Fetch one article by BWB-id + article number (+ optional `lid`) — returns JSON with `citeertitel`, `versiedatum`, `bwbId`, `artikel`, `sectie`, `leden`, `bronreferentie` |
| `wettenbank_zoekterm` | Find which articles contain a term — returns JSON with `artikelen` array (artikelnummer, aantalTreffers, leden), plus `isVolledig` and `totaalTreffers` |

**All tools return pure JSON** (no Markdown) serialized as a string in the MCP `text` content block. The LLM parses and formats the data.

**Validation:** Every tool handler calls `ZodSchema.safeParse()` on input before any network calls. Output is also validated before serialisation. Errors return `{ "fout": "<message>" }` (backwards-compatible).

**XML parsing:** Uses `@xmldom/xmldom` (`DOMParser`) throughout. The `wetParser` / `fast-xml-parser` dependency has been removed.

**In-memory cache:** `xmlCache` (exported `Map<string, CacheEntry>`, 1-hour TTL) caches the raw SRU XML and parsed `Document` per BWB-id + date combination to avoid redundant network round-trips.

**Data flow (wettenbank_zoek):** Zod validates input → builds CQL query → `sruRequest()` hits SRU endpoint → XML parsed → `parseRecords()` + `dedupliceerOpBwbId()` → Zod validates output → `JSON.stringify(...)`.

**Data flow (wettenbank_artikel):** Zod validates input → `haalWetstekstOp()` fetches regulation via SRU + repository (checks `xmlCache` first). Returns `{ rawXml, doc, regeling }`. `extraheerDocMetadata()` provides `citeertitel` + `versiedatum`. `zoekArtikelInDom()` locates the artikel node. `parseElement()` + `normalizeNode()` + `transformToMcpLite()` (all from `bwb-parser`) format the article content into `McpLiteNode[]`. `bouwJciUri()` builds the `bronreferentie`. Zod validates output → `JSON.stringify(...)`.

**Data flow (wettenbank_zoekterm):** Zod validates input → `zoekTermInArtikelDom()` groups matches per article node from XML DOM, returns `{ artikelen, isVolledig, totaalTreffers }`. `parseZoekterm()` handles EN/OF operators (AND/OR accepted as aliases). `maxResultaten` parameter limits the output array; `totaalTreffers` reflects the full count (all matching articles, before slice). Zod validates output → `JSON.stringify(...)`.

### bwb-parser module (`src/bwb-parser/`)

Handles all article XML → structured data conversion. Key exports:

| Export | Purpose |
|--------|---------|
| `parseElement(node)` | Converts a DOM `Element` to a raw `ParsedNode` tree |
| `normalizeNode(node)` | Flattens nested structure, resolves `lid`/`al`/`lijst` hierarchy |
| `transformToMcpLite(nodes, opts)` | Converts to `McpLiteNode[]` — the output format sent to the LLM |
| `parseBwb(xml, bwbId, citeertitel, versiedatum)` | Full pipeline: parse → normalize → transform; returns `ParseResult` with `.raw`, `.normalized`, `.mcpLite` |

`McpLiteNode` has: `sectie`, `tekst`, `bwbId`, `citeertitel`, `bronreferentie`.

### `wettenbank_zoekterm` — wildcards en operatoren

`bouwTermPatroon(zoekterm)` zet een zoekterm om naar een regex-patroon:

| Invoer | Regex | Matcht |
|--------|-------|--------|
| `termijn` | `\btermijn\b` | alleen het exacte woord |
| `termijn*` | `\btermijn\w*` | `termijn`, `termijnen`, `termijnoverschrijding` |
| `*termijn` | `\w*termijn\b` | `termijn`, `betalingstermijn` |
| `*termijn*` | `\w*termijn\w*` | alles met `termijn` erin |

`parseZoekterm(zoekterm)` normaliseert eerst ` AND ` → ` EN ` en ` OR ` → ` OF `, splitst daarna op ` EN ` of ` OF `, en geeft een `ZoekInput` terug met `patronen: RegExp[]` en `operator: "EN"|"OF"`. `zoekTermInArtikelDom` filtert bij EN af op artikelen waar alle patronen minstens één keer voorkomen.

Speciale tekens worden vooraf geescapet via `escapeerRegex()`.

### XML-schemas als ontwerpbasis

De server laadt geen XSD's op en valideert er niet mee, maar twee publieke schemas van `repository.officiele-overheidspublicaties.nl` vormen de stille blauwdruk achter de parselogica:

**`BWB-toestand/2016-1` (`toestand_2016-1.xsd`)** — beschrijft de XML-structuur van wetsdocumenten die het repository serveert. Hierop is gebaseerd:
- De structurele containers in `zoekArtikelInDom`: `boek`, `deel`, `hoofdstuk`, `afdeling`, `paragraaf`, `wettekst`, `wetgeving`, `circulaire`, `circulaire-tekst` zijn XSD-elementnamen. Let op `circulaire-tekst`: de Leidraad heeft de structuur `circulaire → circulaire-tekst → circulaire.divisie[]`; zonder dit niveau werden alle Leidraad-artikelen niet gevonden.
- De veldnamen die `bwb-parser` herkent: `kop`, `nr`, `al`, `lid`, `lidnr`, `lijst`, `li`, `tekst`.
- Elementen die als array worden geparsed (meervoudig voorkomen): `artikel`, `lid`, `li`, `circulaire.divisie`.

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
