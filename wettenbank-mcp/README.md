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

| Tool                   | Doel                                                                 |
|------------------------|----------------------------------------------------------------------|
| `wettenbank_zoek`      | Regelingen zoeken op titel, rechtsgebied, ministerie of regelingsoort; retourneert BWB-id + metadata |
| `wettenbank_artikel`   | Één specifiek artikel ophalen via BWB-id + artikelnummer; optioneel historische versie via `peildatum` |
| `wettenbank_zoekterm`  | Zoeken welke artikelen een begrip bevatten; ondersteunt wildcard (`termijn*`) |

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
      ├── wettenbank_artikel ───► SRU-zoekdienst  (stap 1: locatie ophalen)
      │                               └─► Repository (officiele-overheidspublicaties.nl/bwb/)
      │                                       └─► BWB-toestand XML
      │                                               ├─► extraheerArtikelUitXml() [primair]
      │                                               └─► extraheerArtikel()       [fallback]
      │
      └── wettenbank_zoekterm ──► SRU-zoekdienst + Repository (zelfde flow als artikel)
                                      └─► zoekTermInArtikelDom() → artikellijst met treffertellingen
                                              (DOM-gebaseerd; artikel-grenzen uit XML-structuur)

      ▲  tool result (markdown-tekst over stdout)
      │
Claude Code (LLM)
```

### Externe endpoints

| Endpoint                                                         | Gebruik                                            |
|------------------------------------------------------------------|----------------------------------------------------|
| `https://zoekservice.overheid.nl/sru/Search`                     | SRU 2.0-zoekdienst — alle drie tools               |
| `https://repository.officiele-overheidspublicaties.nl/bwb/<id>/` | BWB-toestand XML — wettenbank_artikel + zoekterm   |

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

Zoekt in het Basiswettenbestand op naam en/of filtert op type, rechtsgebied of ministerie. Retourneert BWB-id + metadata.

**Parameters:**

| Parameter       | Type   | Verplicht | Omschrijving                                                      |
|-----------------|--------|:---------:|-------------------------------------------------------------------|
| `titel`         | string |           | Zoekterm in de regelingtitel, bijv. `"Invorderingswet"`           |
| `rechtsgebied`  | string |           | Bijv. `"belastingrecht"`, `"arbeidsrecht"`                        |
| `ministerie`    | string |           | Bijv. `"Financiën"`, `"Justitie"`                                 |
| `regelingsoort` | enum   |           | `wet` · `AMvB` · `ministeriele-regeling` · `regeling` · `besluit`|
| `maxResultaten` | number |           | Maximum aantal resultaten (standaard: 10, maximum: 50)            |

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

### 3.2  `wettenbank_artikel`

Haalt één artikel op uit een regeling via BWB-id en artikelnummer. De response bevat de structuurpositie (hoofdstuk/afdeling) als afzonderlijke regels boven de artikelkop wanneer beschikbaar, en een JCI-bronreferentie onderaan.

**Parameters:**

| Parameter   | Type   | Verplicht | Omschrijving                                                               |
|-------------|--------|:---------:|----------------------------------------------------------------------------|
| `bwbId`     | string | **ja**    | BWB-id van de regeling, bijv. `BWBR0004770`                                |
| `artikel`   | string | **ja**    | Artikelnummer, bijv. `"25"` (IW 1990) of `"3:40"` (Awb). Gebruik `"N.M"`-notatie om één lid op te vragen: `"9.1"` haalt artikel 9, lid 1 op. |
| `peildatum` | string |           | Historische versie op datum `YYYY-MM-DD` (standaard: vandaag)              |

**Gegevensflow:**

```
1. SRU-query: dcterms.identifier==<bwbId> and overheidbwb.geldigheidsdatum==<datum>
   → repositoryUrl uit enrichedData

2. GET <repositoryUrl>  (BWB-toestand XML)
   → extraheerDocMetadata()   citeertitel + versiedatum voor header
   → parseerArtikelParam()    splits "9.1" → artikelnr="9", lidnr="1"
   → extraheerArtikelUitXml(rawXml, artikelnr, lidnr?)  [primair: DOM-traversal + lid-filter]
   → extraheerArtikel(stripXml(rawXml), artikelnr)      [fallback: tekst-regex]
   → detecteerArtikelStatus()  ⚠️-waarschuwing bij vervallen artikel
   → bouwJciUri()              Bronreferentie onderaan de output
```

**Resultaatformaat:**

```
Invorderingswet 1990 > Versie geldig op: YYYY-MM-DD

Hoofdstuk II — Invordering in eerste aanleg
Afdeling 1 — Betalingstermijnen

Artikel 9 Betalingstermijnen
1. Een belastingaanslag is invorderbaar zes weken na de dagtekening.
   a. voor aanslagbelastingen...
…

Bronreferentie: jci1.3:c:BWBR0004770&artikel=9
```

De header gebruikt de `<citeertitel>` en `inwerkingtredingsdatum` uit de BWB-toestand XML; bij ontbreken wordt de SRU-metadata gebruikt. Als het artikel de status `"vervallen"` heeft, verschijnt een `⚠️`-waarschuwing boven de tekst.

Geeft `Artikel <nr> niet gevonden in deze wet.` als het artikelnummer niet bestaat.

---

### 3.3  `wettenbank_zoekterm`

Zoekt welke artikelen een begrip bevatten en retourneert een gesorteerde lijst met treffertellingen en directe aanroepaanwijzingen voor `wettenbank_artikel`.

**Parameters:**

| Parameter   | Type   | Verplicht | Omschrijving                                                                           |
|-------------|--------|:---------:|----------------------------------------------------------------------------------------|
| `bwbId`     | string | **ja**    | BWB-id van de regeling, bijv. `BWBR0004770`                                            |
| `zoekterm`  | string | **ja**    | Te zoeken begrip. Wildcard mogelijk: `"termijn*"` matcht `termijnen`, `termijnoverschrijding` etc. |
| `peildatum` | string |           | Historische versie op datum `YYYY-MM-DD` (standaard: vandaag)                          |

**Wildcard:** via `bouwTermPatroon()` — `"termijn*"` → regex `termijn\w*`. Speciale tekens worden eerst geescapet via `escapeerRegex()`.

**Zoekstrategie:** DOM-gebaseerd via `zoekTermInArtikelDom()` — de term wordt per artikel-node gezocht in de `<al>`-, `<lid>`- en `<lijst>`-tekst. Artikel-grenzen komen uit de XML-structuur, niet uit tekstpatronen. Dit voorkomt false positives vanuit inhoudsopgaven en kruisverwijzingen.

**Resultaatformaat:**

```
Invorderingswet 1990 > Versie geldig op: YYYY-MM-DD

"dwangbevel" — 12 treffer(s) in 4 artikel(en)

Artikel 13 — 5 treffer(s)
  → wettenbank_artikel(bwbId="BWBR0004770", artikel="13")

Artikel 14 — 3 treffer(s)
  → wettenbank_artikel(bwbId="BWBR0004770", artikel="14")
```

Geeft `"<zoekterm>" niet gevonden in deze wet.` als de term nergens voorkomt.

---

## 4  Gegevensmodel

### Interface `Regeling`

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
| `haalWetstekstOp()`         | ja            | Combineert SRU-lookup + repository-download; geeft `formatted`, `inhoud`, `rawXml`, `regeling` terug |
| `stripXml()`                | ja            | Verwijdert XML-tags, decodeert entities, comprimeert witruimte          |
| `renderAl()`                | ja            | Zet inline `<al>`-markup om naar Markdown: `<extref>` → link, `<nadruk>` → vet/cursief, dan `stripXml` |
| `getAlText()`               | ja            | Extraheert tekstinhoud van een `<al>`-element; voorkomt `[object Object]` bij `<al>`-nodes met attributen |
| `parseerArtikelParam()`     | ja            | Splitst `"9.1"` → `{artikelnr:"9", lidnr:"1"}`; Leidraad-subartikelen worden eerst exact opgezocht |
| `extraheerArtikelUitXml()`  | ja            | DOM-gebaseerde artikel-extractie uit BWB-toestand XML (primair)         |
| `extraheerArtikel()`        | ja            | Regex-gebaseerde artikel-extractie uit platte tekst (fallback)          |
| `detecteerArtikelStatus()`  | ja            | Controleert `@_status` op de artikel-node; geeft waarschuwing bij `"vervallen"` |
| `zoekTermInArtikelDom()`    | ja            | DOM-gebaseerde term-zoekfunctie voor `wettenbank_zoekterm`; per artikel-node, niet op platte tekst |
| `extraheerDocMetadata()`    | ja            | Haalt `citeertitel` en `inwerkingtredingsdatum` op uit de BWB-toestand DOM |
| `bouwJciUri()`              | ja            | Construeert JCI-uri: `jci1.3:c:<bwbId>&artikel=<nr>`                   |
| `vindArtikelContext()`      | ja            | Zoekt dichtstbijzijnde artikelkop vóór een matchpositie in platte tekst (niet gebruikt door zoekterm) |
| `escapeerRegex()`           | ja            | Escapet regex-speciale tekens voor veilig gebruik in `RegExp`           |
| `bouwTermPatroon()`         | ja            | Bouwt regex-patroon: letterlijk of wildcard (`termijn*` → `termijn\w*`) |
| `zoekArtikelInDom()`        | nee           | Recursieve DOM-traversal voor artikel-lookup (max. diepte: 30)          |
| `formateerArtikelNode()`    | nee           | Zet een XML-artikelnode om naar Markdown met lidnummering en structuurprefix |
| `vandaag()`                 | nee           | Geeft de huidige datum terug als `YYYY-MM-DD`                           |

---

### 5.2  `haalWetstekstOp(bwbId, peildatum?)`

Centrale hulpfunctie gedeeld door `wettenbank_artikel` en `wettenbank_zoekterm`. Voert twee netwerkverzoeken uit:

1. **SRU-lookup** — zoekt de regeling op BWB-id en datum; extraheert de `repositoryUrl`.
2. **Repository-download** — haalt de BWB-toestand XML op van `officiele-overheidspublicaties.nl`.

Geeft vier waarden terug (`WetstekstResultaat`):

| Returnwaarde | Inhoud                                                                              |
|--------------|-------------------------------------------------------------------------------------|
| `formatted`  | Markdown inclusief header én wetstekst (achterwaartse compatibiliteit)              |
| `inhoud`     | Uitsluitend de wetstekst, **zonder** header                                         |
| `rawXml`     | Onbewerkte XML voor DOM-gebaseerde extractie                                        |
| `regeling`   | `Regeling`-object uit SRU (titel, BWB-id, geldigVanaf — fallback voor header/metadata) |

> De scheiding tussen `formatted` en `inhoud` is bewust: zoektermen worden uitsluitend in `inhoud` gezocht, zodat woorden in de header (bijv. "belasting" in de wettitel) niet als vindplaats worden geteld.

---

### 5.3  `bouwTermPatroon(zoekterm)`

Bouwt een regex-patroon voor `wettenbank_zoekterm`:

| Invoer        | Patroon           | Gedrag                                            |
|---------------|-------------------|---------------------------------------------------|
| `"termijn"`   | `termijn`         | Letterlijke match                                 |
| `"termijn*"`  | `termijn\w*`      | Matcht `termijnen`, `termijnoverschrijding`, e.d. |
| `"art. 9*"`   | `art\. 9\w*`      | Speciale tekens geescapet vóór wildcard           |

---

### 5.4  `vindArtikelContext(tekst, matchIndex)`

Zoekt de dichtstbijzijnde artikelkop **vóór** `matchIndex`. Regex: `/Artikel\s+[\d:]+[a-z]*/gi` — ondersteunt zowel enkelvoudige nummers (`Artikel 25`) als Awb-stijl (`Artikel 3:40`).

---

### 5.5  `extraheerArtikelUitXml(rawXml, artikelnummer)`

**Primaire** methode voor artikel-extractie. Gebruikt DOM-traversal via `fast-xml-parser`.

**Zoekstrategie van `zoekArtikelInDom`:**

```
Per node (max. diepte 30):
  ├── [artikel]              → kop/nr vergelijken; recursief in kinderen zoeken
  ├── [circulaire.divisie]   → kop/nr vergelijken; recursief in kinderen zoeken
  └── [structurele containers: boek, deel, hoofdstuk, afdeling, paragraaf,
       wettekst, wet-besluit, wetgeving, circulaire, tekst]
        → recursief doorzoeken; hoofdstuk/afdeling toegevoegd aan ancestor-keten
```

Ondersteunt twee documenttypen:

| Documenttype         | XML-element             | Voorbeeld                       |
|----------------------|-------------------------|---------------------------------|
| Reguliere wet        | `<artikel>`             | IW 1990, AWR, Awb               |
| Leidraad / circulaire| `<circulaire.divisie>`  | Leidraad Invordering 2008       |

Geeft `null` terug als het artikel niet wordt gevonden of als de XML niet parseerbaar is.

---

## 6  XML-schemas

De server laadt geen XSD-bestanden op maar baseert zijn parselogica op twee publieke schemas van `repository.officiele-overheidspublicaties.nl`:

### 6.1  BWB-toestand/2016-1 (`toestand_2016-1.xsd`)

| Beslissing                             | XSD-grondslag                                                                        |
|----------------------------------------|--------------------------------------------------------------------------------------|
| `isArray`-lijst in `wetParser`         | Elementen met `maxOccurs="unbounded"` moeten als array worden geparsed               |
| Structurele containers in `zoekArtikelInDom` | `boek`, `deel`, `hoofdstuk`, `afdeling`, `paragraaf`, `wettekst`, `wetgeving` zijn XSD-elementnamen |
| Veldnamen in `formateerArtikelNode`    | `kop`, `nr`, `al`, `lid`, `lidnr`, `lijst`, `li`, `tekst` zijn XSD-velden           |
| `stopNodes: ["*.al"]`                  | `<al>` is mixed content; `stopNodes` bewaart de ruwe string voor `stripXml`         |

**`isArray`-lijst:**

```typescript
["artikel", "lid", "li", "circulaire.divisie",
 "paragraaf", "afdeling", "hoofdstuk", "boek", "deel",
 "bwb-wijziging", "jci", "row", "tgroup"]
```

### 6.2  BWB-WTI/2016-1 (`wti_2016-1.xsd`)

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

Alle tool-handlers zijn omgeven door een `try/catch`. Bij een fout geeft de server:

```json
{ "content": [{ "type": "text", "text": "Fout: <message>" }], "isError": true }
```

### Specifieke foutgevallen

| Situatie                                | Reactie                                                                           |
|-----------------------------------------|-----------------------------------------------------------------------------------|
| Onbekend BWB-id (SRU geeft 0 records)   | Fout met vermelding van bekende BWB-ids (IW 1990, AWR, Awb, Leidraad 2008)        |
| Repository niet bereikbaar (HTTP-fout)  | `inhoud = "(Wetstekst niet bereikbaar: <status>)"` — geen crash                   |
| Netwerkfout bij repository-fetch        | `inhoud = "(Fout bij ophalen wetstekst)"` — geen crash                            |
| SRU HTTP-fout                           | `Error("SRU HTTP <status>")` → valt terug op tool-niveau catch                   |
| Artikel niet gevonden                   | `"Artikel <nr> niet gevonden in deze wet."` in de tekst-output               |
| Term niet gevonden                      | `"<term>" niet gevonden in deze wet.` in de tekst-output                     |
| DOM-parse fout of lege XML              | `extraheerArtikelUitXml` geeft `null` → fallback naar `extraheerArtikel`         |
| Recursie-diepte > 30                    | `zoekArtikelInDom` stopt en geeft `null` terug (bescherming tegen stack overflow) |

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

| Testsuite                         | Getest gedrag                                                                       |
|-----------------------------------|-------------------------------------------------------------------------------------|
| `escapeerRegex`                   | Regex-speciale tekens escapen; gewone tekst ongewijzigd laten                       |
| `bouwTermPatroon`                 | Letterlijke term; wildcard `*`-suffix; speciale tekens met wildcard                 |
| `stripXml`                        | Tags verwijderen; CDATA uitpakken; entities decoderen; spaties samenvoegen          |
| `renderAl`                        | `<extref>` → Markdown-link; `<nadruk type="vet">` → `**vet**`; `<intref>` → cursief; onbekende tags weggegooid |
| `bouwJciUri`                      | Standaard-format; Awb-nummers met dubbele punt; Leidraad-subartikelen               |
| `extraheerArtikel`                | Artikel op nummer; dubbele punt (Awb); null-fallback; metadata stripping            |
| `extraheerArtikelUitXml`          | Reguliere wet; Awb (`:` in nr); Leidraad (`circulaire.divisie`); subartikel; structuurprefix; depth-limit; lege XML |
| `detecteerArtikelStatus`          | Null bij "geldend"; waarschuwing bij "vervallen"; null bij lege XML                 |
| `zoekTermInArtikelDom`            | Juist artikel; meerdere treffers; lege array; kruisverwijzing telt bij bronartikelen; wildcard; `<lid>`-tekst |
| `extraheerDocMetadata`            | Citeertitel + versiedatum uit `<toestand>`-structuur; lege strings als structuur ontbreekt |
| `parseRecords`                    | Leeg resultaat; enkelvoudig record; meerdere rechtsgebieden; twee records           |
| `formatRegelingen`                | Lege lijst; BWB-id/titel aanwezig; oplopende nummering; titel-fallback              |
| `dedupliceerOpBwbId`              | Unieke ids; meest recente versie bewaren; lege invoer; gemengde invoer              |
| `haalWetstekstOp`                 | Peildatum vandaag/historisch; onbekend BWB-id; HTTP-fout; netwerkfout; `formatted` vs. `inhoud` |
| Zoekterm in `inhoud`              | Woord in header telt niet mee; vindplaatsen in wetstekst correct                    |
| `vindArtikelContext`              | Dichtstbijzijnde artikel; geen artikel; letterachtervoegsel; Awb-stijl (`3:40`)     |
| `sruRequest`                      | HTTPS-gebruik; HTTP-foutcode; correcte tekst teruggeven                             |

### Bekende beperkingen

| Beperking                       | Toelichting                                                                                     |
|---------------------------------|-------------------------------------------------------------------------------------------------|
| Vervallen artikelen gefilterd   | De SRU-dienst retourneert alleen geldende artikelen; gaten in de nummering zijn normaal         |
| EU-verordeningen niet beschikbaar | Documenten zoals het Douanewetboek van de Unie zijn niet opgenomen in het BWB                |
| Leidraad-subartikelen           | Subartikelen (bijv. `25.1`) zijn bereikbaar via `wettenbank_artikel`; het hoofdartikel toont uitsluitend de inleidende tekst |
