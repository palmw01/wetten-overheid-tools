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
| `wettenbank_zoek` | Search by title, rechtsgebied, ministerie, or regelingsoort — returns JSON with `regelingen` array |
| `wettenbank_artikel` | Fetch one article by BWB-id + article number — returns JSON with `citeertitel`, `versiedatum`, `structuurpad`, `tekst`, `bronreferentie`, `waarschuwing` |
| `wettenbank_zoekterm` | Find which articles contain a term — returns JSON with `artikelen` array (artikel, aantalTreffers, leden) |

**All tools return pure JSON** (no Markdown) serialized as a string in the MCP `text` content block. The LLM parses and formats the data.

**Data flow (wettenbank_zoek):** builds CQL query → `sruRequest()` hits SRU endpoint → XML parsed → `parseRecords()` + `dedupliceerOpBwbId()` → `JSON.stringify({ query, totaal, dubbeleVerwijderd, regelingen })`.

**Data flow (wettenbank_artikel):** `haalWetstekstOp()` fetches regulation via SRU + repository. `extraheerArtikelUitXml()` returns `{ tekst, structuurpad }` via DOM-traversal (`formateerArtikelNode` splits context from article text). `parseerArtikelParam()` handles `N.M`-notation for lid-filter. `extraheerDocMetadata()` provides citeertitel + versiedatum. `detecteerArtikelStatus()` provides the `waarschuwing`. `bouwJciUri()` provides the `bronreferentie`. All assembled as `JSON.stringify({...})`.

**Data flow (wettenbank_zoekterm):** `zoekTermInArtikelDom()` groups matches per article node from XML DOM. `parseZoekterm()` handles EN/OF operators. Returns `JSON.stringify({ wet, versiedatum, bwbId, zoekterm, totaalTreffers, aantalArtikelen, artikelen })`.

### `wettenbank_zoekterm` — wildcards en operatoren

`bouwTermPatroon(zoekterm)` zet een zoekterm om naar een regex-patroon:

| Invoer | Regex | Matcht |
|--------|-------|--------|
| `termijn` | `\btermijn\b` | alleen het exacte woord |
| `termijn*` | `\btermijn\w*` | `termijn`, `termijnen`, `termijnoverschrijding` |
| `*termijn` | `\w*termijn\b` | `termijn`, `betalingstermijn` |
| `*termijn*` | `\w*termijn\w*` | alles met `termijn` erin |

`parseZoekterm(zoekterm)` splitst op ` EN ` of ` OF ` en geeft een `ZoekInput` terug met `patronen: RegExp[]` en `operator: "EN"|"OF"`. `zoekTermInArtikelDom` filtert bij EN af op artikelen waar alle patronen minstens één keer voorkomen.

Speciale tekens worden vooraf geescapet via `escapeerRegex()`.

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
