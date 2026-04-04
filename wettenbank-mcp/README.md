# Wettenbank MCP — Documentatie

**Versie:** 1.0.0  
**Taal:** TypeScript (ESM)  
**Transportprotocol:** StdIO (MCP)  
**Databron:** wetten.overheid.nl — publieke SRU-interface (CC-0, geen API-sleutel vereist)

---

## Inhoud

1. [Doel en werking](#1-doel-en-werking)
2. [Architectuur](#2-architectuur)
3. [Tools](#3-tools)
4. [Gegevensmodel](#4-gegevensmodel)
5. [Interne functies](#5-interne-functies)
6. [XML-schemas](#6-xml-schemas)
7. [Foutafhandeling](#7-foutafhandeling)
8. [Installatie en configuratie](#8-installatie-en-configuratie)
9. [Ontwikkeling en testen](#9-ontwikkeling-en-testen)

---

## 1  Doel en werking

De Wettenbank MCP-server maakt het mogelijk om **vanuit Claude Code rechtstreeks actuele Nederlandse wetgeving op te vragen** via de publieke SRU-interface van wetten.overheid.nl. Er is geen API-sleutel vereist: alle data is onder CC-0 openbaar beschikbaar.

**Drie tools zijn beschikbaar:**

| Tool                     | Doel                                                                 |
|--------------------------|----------------------------------------------------------------------|
| `wettenbank_zoek`        | Regelingen zoeken op titel, rechtsgebied, ministerie of regelingsoort|
| `wettenbank_ophalen`     | Volledige wetstekst ophalen via BWB-id; optioneel één specifiek artikel |
| `wettenbank_wijzigingen` | Gewijzigde regelingen ophalen sinds een opgegeven datum              |

---

## 2  Architectuur

### Communicatiemodel

```
Claude Code (LLM)
      │  tool call (JSON over stdin)
      ▼
  MCP-server (wettenbank-mcp, Node.js subprocess)
      │
      ├── wettenbank_zoek ──────► SRU-zoekdienst (zoekservice.overheid.nl)
      │                               └─► XML-response (SRU 2.0)
      │                                       └─► parseRecords() → Regeling[]
      │
      ├── wettenbank_ophalen ───► SRU-zoekdienst  (stap 1: locatie ophalen)
      │                               └─► Repository (officiele-overheidspublicaties.nl/bwb/)
      │                                       └─► BWB-toestand XML
      │                                               ├─► extraheerArtikelUitXml() [primair]
      │                                               ├─► extraheerArtikel()       [fallback]
      │                                               └─► stripXml() → platte tekst
      │
      └── wettenbank_wijzigingen ► SRU-zoekdienst (dcterms.modified >= datum)
                                      └─► parseRecords() → Regeling[]

      ▲  tool result (markdown-tekst over stdout)
      │
Claude Code (LLM)
```

### Processchema

```mermaid
flowchart TD
    IN([Claude — tool call])
    IN --> DISPATCH{Tool?}

    DISPATCH -->|wettenbank_zoek|       Z1
    DISPATCH -->|wettenbank_ophalen|    O1
    DISPATCH -->|wettenbank_wijzigingen| W1

    subgraph SZ [" wettenbank_zoek "]
        Z1{titel +\ntrefwoord?}
        Z_TWEE["Stap 1: SRU op titel\nStap 2: XML downloaden\nStap 3: trefwoord in tekst zoeken\nContextfragmenten ± 100 tekens"]
        Z_EEN["SRU-query CQL\ntitel / rechtsgebied /\nministerie / regelingsoort"]
        Z_OUT["parseRecords()\ndedupliceerOpBwbId()\nformatRegelingen()"]
        Z1 -->|"Ja  —  twee-staps"| Z_TWEE --> Z_OUT
        Z1 -->|"Nee  —  enkel filter"| Z_EEN  --> Z_OUT
    end

    subgraph SO [" wettenbank_ophalen "]
        O1["SRU-lookup\nbwbId + peildatum\n→ repositoryUrl"]
        O2["GET repository XML\nstripXml() → platte tekst"]
        O3{Parameter?}
        O_ART["extraheerArtikelUitXml()\nprimair: DOM-traversal\nfallback: extraheerArtikel()"]
        O_ZT["Vindplaatsen zoeken\n± 150 tekens context\nmax. 10 fragmenten"]
        O_FULL["Volledige wetstekst\n~ 50 KB limiet"]
        O1 --> O2 --> O3
        O3 -->|artikel|  O_ART
        O3 -->|zoekterm| O_ZT
        O3 -->|geen|     O_FULL
    end

    subgraph SW [" wettenbank_wijzigingen "]
        W1["SRU-query\ndcterms.modified >= sindsdatum\n+ optionele filters"]
        W2["Sorteren op wijzigingsdatum\ndedupliceerOpBwbId()"]
        W1 --> W2
    end

    Z_OUT  --> OUT
    O_ART  --> OUT
    O_ZT   --> OUT
    O_FULL --> OUT
    W2     --> OUT

    OUT([Markdown-resultaat\nnaar Claude])
```

### Externe endpoints

| Endpoint                                                         | Gebruik                                      |
|------------------------------------------------------------------|----------------------------------------------|
| `https://zoekservice.overheid.nl/sru/Search`                     | SRU 2.0-zoekdienst — alle drie tools         |
| `https://repository.officiele-overheidspublicaties.nl/bwb/<id>/` | BWB-toestand XML — alleen `wettenbank_ophalen` |

### Technische stack

| Component    | Keuze                                        |
|--------------|----------------------------------------------|
| MCP SDK      | `@modelcontextprotocol/sdk` v1.0.0           |
| XML-parsing  | `fast-xml-parser` v4.3.0                     |
| Transport    | `StdioServerTransport` (stdin/stdout)        |
| Taal         | TypeScript 5, ESM modules                   |
| Testframework| Vitest 2                                     |

---

## 3  Tools

### 3.1  `wettenbank_zoek`

Zoekt in het Basiswettenbestand op naam en/of filtert op type, rechtsgebied of ministerie.

**Parameters:**

| Parameter       | Type   | Verplicht | Omschrijving                                                                              |
|-----------------|--------|:---------:|-------------------------------------------------------------------------------------------|
| `titel`         | string |           | Zoekterm in de regelingtitel, bijv. `"Invorderingswet"`                                   |
| `trefwoord`     | string |           | Gecombineerd met `titel`: zoekt in de volledige wetstekst; zonder `titel` doorzoekt het uitsluitend metadata |
| `rechtsgebied`  | string |           | Bijv. `"belastingrecht"`, `"arbeidsrecht"`                                                |
| `ministerie`    | string |           | Bijv. `"Financiën"`, `"Justitie"`                                                         |
| `regelingsoort` | enum   |           | `wet` · `AMvB` · `ministeriele-regeling` · `regeling` · `besluit`                        |
| `maxResultaten` | number |           | Maximum aantal resultaten (standaard: 10, maximum: 50)                                    |

**Zoekgedrag per parametercombinatie:**

| Combinatie                        | Gedrag                                                                                  |
|-----------------------------------|-----------------------------------------------------------------------------------------|
| alleen `titel`                    | CQL: `overheidbwb.titel any "…"` — zoekt in regelingtitels                             |
| alleen `trefwoord`                | CQL: `cql.anywhere any "…"` — doorzoekt metadata-velden (zelden nuttig voor juridische begrippen) |
| `titel` + `trefwoord`             | **Twee-staps:** wet zoeken op titel → volledige XML downloaden → trefwoord zoeken met contextfragmenten |
| met `rechtsgebied` / `ministerie` | Filtert resultaten via extra CQL-clause                                                 |

> **Aandachtspunt:** `titel` en `trefwoord` worden **nooit** als gecombineerde CQL-query verstuurd — dit veroorzaakt een ongeldige query en HTTP 500. De twee-staps aanpak omzeilt dit correct.

**Resultaatformaat:**

```
## Resultaten (N) *(X historische versie(s) weggelaten)*
Query: `<CQL-query>`

1. **[Wettitel]**
   BWB-id: `BWBR…` | Type: wet
   Ministerie: Financiën | Rechtsgebied: Belastingrecht
   Geldig: YYYY-MM-DD – YYYY-MM-DD | Gewijzigd: YYYY-MM-DD
   URL: https://…
```

---

### 3.2  `wettenbank_ophalen`

Haalt de actuele (of historische) wetstekst op voor een BWB-id. Optioneel wordt één specifiek artikel of een zoekterm in de tekst afgehandeld.

**Parameters:**

| Parameter   | Type   | Verplicht | Omschrijving                                                                               |
|-------------|--------|:---------:|--------------------------------------------------------------------------------------------|
| `bwbId`     | string | **ja**    | BWB-id van de regeling, bijv. `BWBR0004770`                                                |
| `peildatum` | string |           | Historische versie op datum `YYYY-MM-DD` (standaard: vandaag)                              |
| `artikel`   | string |           | Artikelnummer om direct op te halen, bijv. `"3:40"` (Awb) of `"25"` (IW 1990)            |
| `zoekterm`  | string |           | Zoekt het begrip in de wetstekst; toont vindplaatsen met ±150 tekens context (max. 10)    |

**Gedrag per parametervariant:**

| Variant                  | Gedrag                                                                                  |
|--------------------------|-----------------------------------------------------------------------------------------|
| alleen `bwbId`           | Volledige wetstekst teruggeven (beperkt tot ~50 KB door SRU-limiet)                     |
| `bwbId` + `artikel`      | Uitsluitend het gevraagde artikel teruggeven; werkt ook boven de 50 KB-grens            |
| `bwbId` + `zoekterm`     | Wetstekst ophalen en alle vindplaatsen tonen met contextfragmenten                      |
| `bwbId` + `peildatum`    | Versie geldig op de opgegeven datum ophalen (historisch)                                |

**Twee-staps gegevensflow bij `artikel`:**

```
1. SRU-query: dcterms.identifier==<bwbId> and overheidbwb.geldigheidsdatum==<datum>
   → repositoryUrl uit enrichedData

2. GET <repositoryUrl>  (BWB-toestand XML)
   → extraheerArtikelUitXml(rawXml, artikelnummer)    [primair: DOM-traversal]
   → extraheerArtikel(stripXml(rawXml), artikelnummer) [fallback: tekst-regex]
```

**Resultaatformaat (header altijd aanwezig):**

```
# [Wettitel]
**BWB-id:** BWBR… | **Type:** wet
**Ministerie:** … | **Rechtsgebied:** …
**Geldig:** YYYY-MM-DD – YYYY-MM-DD | **Gewijzigd:** YYYY-MM-DD
**Bron:** https://…

---

[Artikeltekst of volledige wetstekst of zoekresultaten]
```

---

### 3.3  `wettenbank_wijzigingen`

Haalt regelingen op die na een bepaalde datum zijn gewijzigd, gesorteerd op wijzigingsdatum (nieuwste eerst).

**Parameters:**

| Parameter       | Type   | Verplicht | Omschrijving                                           |
|-----------------|--------|:---------:|--------------------------------------------------------|
| `sindsdatum`    | string | **ja**    | Startdatum `YYYY-MM-DD`, bijv. `"2024-01-01"`          |
| `rechtsgebied`  | string |           | Bijv. `"belastingrecht"`                               |
| `ministerie`    | string |           | Bijv. `"Financiën"`                                    |
| `maxResultaten` | number |           | Maximum aantal resultaten (standaard: 20, maximum: 50) |

**CQL-query:** `dcterms.modified >= <sindsdatum> [and filters]`

---

## 4  Gegevensmodel

### Interface `Regeling`

Elke regeling die uit de SRU-response wordt geparsed, heeft de volgende velden:

| Veld           | Type   | XSD-bron (BWB-WTI)                                              | Omschrijving                           |
|----------------|--------|-----------------------------------------------------------------|----------------------------------------|
| `bwbId`        | string | `owmskern/dcterms:identifier`                                   | Uniek BWB-id, bijv. `BWBR0004770`      |
| `titel`        | string | `owmskern/dcterms:title`                                        | Officiële titel van de regeling        |
| `type`         | string | `owmskern/dcterms:type`                                         | `wet`, `AMvB`, `beleidsregel`, e.d.    |
| `ministerie`   | string | `owmskern/overheid:authority`                                   | Verantwoordelijk ministerie            |
| `rechtsgebied` | string | `bwbipm/overheidbwb:rechtsgebied` (kommalijst)                  | Rechtsgebied(en), kommagescheiden      |
| `geldigVanaf`  | string | `bwbipm/overheidbwb:geldigheidsperiode_startdatum`              | Begindatum geldigheid (`YYYY-MM-DD`)   |
| `geldigTot`    | string | `bwbipm/overheidbwb:geldigheidsperiode_einddatum`               | Einddatum geldigheid of `"onbepaald"`  |
| `gewijzigd`    | string | `owmskern/dcterms:modified`                                     | Laatste wijzigingsdatum (`YYYY-MM-DD`) |
| `repositoryUrl`| string | `enrichedData/overheidbwb:locatie_toestand`                     | Directe URL naar de BWB-toestand XML   |

### XML-pad in de SRU-response

```
searchRetrieveResponse
  └── records
        └── record[]
              └── recordData
                    └── gzd
                          ├── originalData
                          │     └── overheidbwb:meta
                          │           ├── owmskern          (dcterms:*, overheid:*)
                          │           └── bwbipm            (overheidbwb:*)
                          └── enrichedData
                                └── overheidbwb:locatie_toestand
```

---

## 5  Interne functies

### 5.1  Overzicht

| Functie                     | Exporteerbaar | Doel                                                                    |
|-----------------------------|:-------------:|-------------------------------------------------------------------------|
| `sruRequest()`              | ja            | HTTP-aanroep naar de SRU-zoekdienst; geeft raw XML terug                |
| `parseRecords()`            | ja            | Parsed SRU-XML naar een array van `Regeling`-objecten                   |
| `dedupliceerOpBwbId()`      | ja            | Behoudt per BWB-id alleen de meest recente versie (op `geldigVanaf`)    |
| `formatRegelingen()`        | ja            | Formatteert een `Regeling[]` als markdown                               |
| `haalWetstekstOp()`         | ja            | Combineert SRU-lookup + repository-download + header-opmaak             |
| `stripXml()`                | ja            | Verwijdert XML-tags, decodeert entities, comprimeert witruimte          |
| `extraheerArtikelUitXml()`  | ja            | DOM-gebaseerde artikel-extractie uit BWB-toestand XML (primair)         |
| `extraheerArtikel()`        | ja            | Regex-gebaseerde artikel-extractie uit platte tekst (fallback)          |
| `vindArtikelContext()`      | ja            | Zoekt de dichtstbijzijnde artikelkop vóór een matchpositie              |
| `escapeerRegex()`           | ja            | Escapet regex-speciale tekens voor veilig gebruik in `RegExp`           |
| `zoekArtikelInDom()`        | nee           | Recursieve DOM-traversal voor artikel-lookup (max. diepte: 30)          |
| `formateerArtikelNode()`    | nee           | Zet een XML-artikelnode om naar platte tekst met lidnummering           |
| `formatFragmenten()`        | nee           | Formatteert regex-matches als geciteerde fragmenten met artikelcontext  |
| `vandaag()`                 | nee           | Geeft de huidige datum terug als `YYYY-MM-DD`                           |

---

### 5.2  `sruRequest(query, maxRecords?)`

Bouwt een SRU 2.0-verzoek en stuurt het naar de zoekdienst.

```typescript
// Opgebouwde querystring:
{
  operation:        "searchRetrieve",
  version:          "2.0",
  "x-connection":   "BWB",
  query:            <CQL-query>,
  maximumRecords:   String(maxRecords),
}
// GET https://zoekservice.overheid.nl/sru/Search?…
```

- Gooit `Error("SRU HTTP <status>")` bij een niet-OK HTTP-status.
- Geeft de ruwe XML-string terug.

---

### 5.3  `parseRecords(xml)`

Parsed de SRU-XML met `fast-xml-parser` en mapt elk `<record>`-element naar een `Regeling`-object. Meerdere `<overheidbwb:rechtsgebied>`-elementen worden samengevoegd met komma's.

---

### 5.4  `dedupliceerOpBwbId(lijst)`

Bij zoeken zonder datum-filter kunnen meerdere versies van dezelfde regeling worden teruggegeven. Deze functie behoudt per BWB-id alleen de versie met de meest recente `geldigVanaf`-datum via lexicografische vergelijking van ISO-datumstrings.

---

### 5.5  `haalWetstekstOp(bwbId, peildatum?)`

De centrale functie van `wettenbank_ophalen`. Voert twee netwerkverzoeken uit:

1. **SRU-lookup** — zoekt de regeling op BWB-id en datum; extraheert de `repositoryUrl`.
2. **Repository-download** — haalt de BWB-toestand XML op van `officiele-overheidspublicaties.nl`.

Geeft drie waarden terug:

| Returnwaarde | Inhoud                                                                              |
|--------------|-------------------------------------------------------------------------------------|
| `formatted`  | Markdown inclusief header (titel, BWB-id, geldigheidsdatum, bron) én wetstekst     |
| `inhoud`     | Uitsluitend de wetstekst, **zonder** header                                         |
| `rawXml`     | Onbewerkte XML voor DOM-gebaseerde artikel-extractie                                |

> De scheiding tussen `formatted` en `inhoud` is bewust: zoektermen worden uitsluitend in `inhoud` gezocht, zodat woorden die in de header voorkomen (bijv. "belasting" in de wettitel) niet als vindplaats in de wetstekst worden geteld.

---

### 5.6  `stripXml(xml)`

Converteert BWB-toestand XML naar platte tekst:

| Stap | Bewerking                                           |
|-----:|-----------------------------------------------------|
|    1 | XML-declaratie (`<?xml … ?>`) verwijderen           |
|    2 | CDATA-secties uitpakken                             |
|    3 | Alle XML-tags verwijderen                           |
|    4 | `&amp;` `&lt;` `&gt;` `&quot;` `&apos;` `&nbsp;` decoderen |
|    5 | Decimale entities `&#NNN;` decoderen                |
|    6 | Hexadecimale entities `&#xHH;` decoderen            |
|    7 | Meerdere opeenvolgende spaties samenvoegen          |
|    8 | Trimmen                                             |

---

### 5.7  `extraheerArtikelUitXml(rawXml, artikelnummer)`

**Primaire** methode voor artikel-extractie. Gebruikt DOM-traversal via `fast-xml-parser` met een configuratie afgestemd op de BWB-toestand XSD.

**Zoekstrategie van `zoekArtikelInDom`:**

```
Per node (max. diepte 30):
  ├── [artikel]              → kop/nr vergelijken; recursief in kinderen zoeken
  ├── [circulaire.divisie]   → kop/nr vergelijken; recursief in kinderen zoeken
  └── [structurele containers: boek, deel, hoofdstuk, afdeling, paragraaf,
       wettekst, wet-besluit, wetgeving, circulaire, tekst]
        → recursief doorzoeken
```

Ondersteunt twee documenttypen:

| Documenttype         | XML-element             | Voorbeeld                       |
|----------------------|-------------------------|---------------------------------|
| Reguliere wet        | `<artikel>`             | IW 1990, AWR, Awb               |
| Leidraad / circulaire| `<circulaire.divisie>`  | Leidraad Invordering 2008       |

Geeft `null` terug als het artikel niet wordt gevonden of als de XML niet parseerbaar is.

---

### 5.8  `extraheerArtikel(tekst, artikelnummer)` *(fallback)*

Splits de platte tekst (output van `stripXml`) op `Artikel \d`-grenzen en selecteert het segment dat begint met het gevraagde artikelnummer. Strips daarna trailing publicatiemetadata (reeksen van `jaar volgnr DD-MM-YYYY`).

Wordt gebruikt wanneer `extraheerArtikelUitXml` `null` teruggeeft.

---

### 5.9  `vindArtikelContext(tekst, matchIndex)`

Zoekt alle `Artikel \d+[a-z]*`-posities in de tekst en geeft de dichtstbijzijnde artikelkop **vóór** `matchIndex` terug. Gebruikt door `formatFragmenten` om bij zoekterm-hits te vermelden in welk artikel de vindplaats staat.

Pre-bouwt de artikelposities eenmalig in O(n) zodat elke lookup O(k) is over het posities-array.

---

## 6  XML-schemas

De server laadt geen XSD-bestanden op maar baseert zijn parselogica op twee publieke schemas van `repository.officiele-overheidspublicaties.nl`:

### 6.1  BWB-toestand/2016-1 (`toestand_2016-1.xsd`)

Beschrijft de XML-structuur van de wetsdocumenten die het repository serveert.

**Invloed op de implementatie:**

| Beslissing                             | XSD-grondslag                                                                        |
|----------------------------------------|--------------------------------------------------------------------------------------|
| `isArray`-lijst in `wetParser`         | Elementen met `maxOccurs="unbounded"` moeten als array worden geparsed; anders breekt DOM-traversal bij enkelvoudige kinderen |
| Structurele containers in `zoekArtikelInDom` | `boek`, `deel`, `hoofdstuk`, `afdeling`, `paragraaf`, `wettekst`, `wetgeving` zijn XSD-elementnamen |
| Veldnamen in `formateerArtikelNode`    | `kop`, `nr`, `al`, `lid`, `lidnr`, `lijst`, `li`, `tekst` zijn XSD-velden           |
| `stopNodes: ["*.al"]`                  | `<al>` is mixed content (tekst + inline markup als `<intref>`, `<extref>`, `<nadruk>`); `stopNodes` bewaart de ruwe string zodat `stripXml` het inline-markup verwijdert |

**`isArray`-lijst:**

```typescript
["artikel", "lid", "li", "circulaire.divisie",
 "paragraaf", "afdeling", "hoofdstuk", "boek", "deel",
 "bwb-wijziging", "jci", "row", "tgroup"]
```

### 6.2  BWB-WTI/2016-1 (`wti_2016-1.xsd`)

Beschrijft de recordstructuur die de SRU-zoekdienst teruggeeft.

**Relevante XSD-paden (gebruikt in `parseRecords`):**

```
gzd
  ├── originalData
  │     └── overheidbwb:meta
  │           ├── owmskern
  │           │     ├── dcterms:identifier   → bwbId
  │           │     ├── dcterms:title        → titel
  │           │     ├── dcterms:type         → type
  │           │     ├── overheid:authority   → ministerie
  │           │     └── dcterms:modified     → gewijzigd
  │           └── bwbipm
  │                 ├── overheidbwb:rechtsgebied                      → rechtsgebied
  │                 ├── overheidbwb:geldigheidsperiode_startdatum     → geldigVanaf
  │                 └── overheidbwb:geldigheidsperiode_einddatum      → geldigTot
  └── enrichedData
        └── overheidbwb:locatie_toestand     → repositoryUrl
```

---

## 7  Foutafhandeling

### Tool-niveau

Alle tool-handlers zijn omgeven door een `try/catch`. Bij een fout geeft de server:

```json
{ "content": [{ "type": "text", "text": "Fout: <message>" }], "isError": true }
```

### Specifieke foutgevallen

| Situatie                                | Reactie                                                                           |
|-----------------------------------------|-----------------------------------------------------------------------------------|
| Onbekend BWB-id (SRU geeft 0 records)   | Fout met vermelding van bekende BWB-ids (IW 1990, AWR, Awb)                       |
| Repository niet bereikbaar (HTTP-fout)  | `inhoud = "(Wetstekst niet bereikbaar: <status>)"` — geen crash                   |
| Netwerkfout bij repository-fetch        | `inhoud = "(Fout bij ophalen wetstekst)"` — geen crash                            |
| SRU HTTP-fout                           | `Error("SRU HTTP <status>")` → valt terug op tool-niveau catch                   |
| Artikel niet gevonden                   | `"Artikel <nr> niet gevonden in deze wet."` in de tekst-output                   |
| DOM-parse fout of lege XML              | `extraheerArtikelUitXml` geeft `null` → fallback naar `extraheerArtikel`         |
| Recursie-diepte > 30                    | `zoekArtikelInDom` stopt en geeft `null` terug (bescherming tegen stack overflow) |

### Metadata-waarschuwing

Bij gebruik van `trefwoord` zonder `titel` wordt een expliciete waarschuwing in de output opgenomen:

```
> **Let op — metadata-zoeken:** `trefwoord` zonder `titel` doorzoekt regelingmetadata,
> niet de wetstekst. Juridische begrippen worden hiermee zelden gevonden.
> Voor in-tekst zoeken: gebruik `wettenbank_ophalen` met `zoekterm`.
```

---

## 8  Installatie en configuratie

### Vereisten

- Node.js ≥ 18 (ESM-ondersteuning vereist)
- npm

### Bouwen

```bash
cd wettenbank-mcp
npm install      # afhankelijkheden installeren
npm run build    # TypeScript compileren → dist/index.js
```

### Bekende BWB-ids

| Wet                                        | BWB-id         |
|--------------------------------------------|----------------|
| Invorderingswet 1990                       | `BWBR0004770`  |
| Uitvoeringsbesluit Invorderingswet 1990    | `BWBR0004772`  |
| Leidraad Invordering 2008                  | `BWBR0024096`  |
| Algemene wet inzake rijksbelastingen (AWR) | `BWBR0002320`  |
| Algemene wet bestuursrecht (Awb)           | `BWBR0005537`  |
| Wet inkomstenbelasting 2001                | `BWBR0011353`  |
| Wet op de vennootschapsbelasting 1969      | `BWBR0002672`  |
| Wet op de omzetbelasting 1968              | `BWBR0002629`  |
| Wet op de loonbelasting 1964               | `BWBR0002471`  |

> **Let op:** BWB-id `BWBR0004800` verwijst naar de *Leidraad invordering 1990* (verlopen per 2005-07-12) — gebruik dit id nooit.

### Configuratie voor Claude Code (CLI)

Voeg toe aan `.claude/settings.json` (project) of `~/.claude/settings.json` (globaal):

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

### Configuratie voor Claude Desktop

Voeg toe aan `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

> Na het aanpassen van de configuratie moet Claude Code / Claude Desktop opnieuw worden gestart.

---

## 9  Ontwikkeling en testen

### Commando's

| Commando              | Doel                                               |
|-----------------------|----------------------------------------------------|
| `npm run build`       | TypeScript compileren naar `dist/`                 |
| `npm run dev`         | Direct uitvoeren met `tsx` (zonder build-stap)     |
| `npm start`           | Gecompileerde server starten: `node dist/index.js` |
| `npm test`            | Unit tests uitvoeren (Vitest, eenmalig)            |
| `npm run test:watch`  | Unit tests in watch-modus                          |

### Testdekking

Alle geëxporteerde functies zijn gedekt door unit tests in `src/index.test.ts`:

| Testsuite                         | Getest gedrag                                                               |
|-----------------------------------|-----------------------------------------------------------------------------|
| `escapeerRegex`                   | Regex-speciale tekens escapen; gewone tekst ongewijzigd laten               |
| `stripXml`                        | Tags verwijderen; CDATA uitpakken; entities decoderen; spaties samenvoegen  |
| `extraheerArtikel`                | Artikel op nummer; dubbele punt (Awb); null-fallback; metadata stripping    |
| `extraheerArtikelUitXml`          | Reguliere wet; Awb (`:` in nr); Leidraad (`circulaire.divisie`); subartikel; depth-limit; lege XML |
| `parseRecords`                    | Leeg resultaat; enkelvoudig record; meerdere rechtsgebieden; twee records   |
| `formatRegelingen`                | Lege lijst; BWB-id/titel aanwezig; oplopende nummering; titel-fallback      |
| `dedupliceerOpBwbId`              | Unieke ids; meest recente versie bewaren; lege invoer; gemengde invoer      |
| `haalWetstekstOp`                 | Peildatum vandaag/historisch; onbekend BWB-id; HTTP-fout; netwerkfout; `formatted` vs. `inhoud` |
| Zoekterm in `inhoud`              | Woord in header telt niet mee; vindplaatsen in wetstekst correct            |
| `vindArtikelContext`              | Dichtstbijzijnde artikel vóór match; geen artikel aanwezig; letterachtervoegsel |
| `sruRequest`                      | HTTPS-gebruik; HTTP-foutcode; correcte tekst teruggeven                     |

### Bekende beperkingen

| Beperking                       | Toelichting                                                                                     |
|---------------------------------|-------------------------------------------------------------------------------------------------|
| 50 KB-limiet zonder `artikel`   | Volledige wetstekst is beperkt tot ~50 KB; gebruik de `artikel`-parameter voor grote wetten     |
| Vervallen artikelen gefilterd   | De SRU-dienst retourneert alleen geldende artikelen; gaten in de nummering zijn normaal         |
| EU-verordeningen niet beschikbaar | Documenten zoals het Douanewetboek van de Unie zijn niet opgenomen in het BWB                |
| Leidraad-subartikelen           | Subartikelen (bijv. `25.1`) zijn bereikbaar via de `artikel`-parameter; de preview van het hoofdartikel toont uitsluitend de inleidende tekst |
| Twee-staps zoeken               | Bij `titel` + `trefwoord` wordt maximaal 1 wet volledig gedownload; voor meerdere wetten zijn meerdere aanroepen nodig |
