---
marp: true
theme: default
paginate: true
header: "Automatische Wetsanalyse — JAS + MCP"
footer: "Belastingdienst — Domein Inning &nbsp;|&nbsp; 2026"
backgroundColor: "#f8f9fa"
style: |
  /* ── Kleurpalet ── */
  :root {
    --bd-blauw:    #003082;
    --bd-lichtblauw: #0065bd;
    --bd-accent:   #e8700a;
    --bd-lichtgrijs: #f0f2f5;
    --bd-wit:      #ffffff;
    --bd-tekst:    #1a1a2e;
  }

  /* ── Basistypografie ── */
  section {
    font-family: "Rijksoverheid Sans", "Noto Sans", Arial, sans-serif;
    font-size: 22px;
    color: var(--bd-tekst);
    background-color: #f8f9fa;
    padding: 50px 64px;
  }

  /* ── Header & footer ── */
  header {
    font-size: 14px;
    color: var(--bd-lichtblauw);
    top: 18px;
    left: 64px;
    right: 64px;
  }
  footer {
    font-size: 13px;
    color: #666;
    bottom: 18px;
    left: 64px;
    right: 64px;
  }

  /* ── Paginanummer ── */
  section::after {
    font-size: 13px;
    color: #888;
    bottom: 18px;
    right: 64px;
  }

  /* ── Koppen ── */
  h1 {
    color: var(--bd-blauw);
    font-size: 46px;
    font-weight: 700;
    border-bottom: 3px solid var(--bd-lichtblauw);
    padding-bottom: 10px;
    margin-bottom: 24px;
  }
  h2 {
    color: var(--bd-blauw);
    font-size: 32px;
    font-weight: 700;
    border-bottom: 2px solid var(--bd-lichtblauw);
    padding-bottom: 8px;
    margin-bottom: 20px;
  }
  h3 {
    color: var(--bd-lichtblauw);
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  /* ── Titeldia ── */
  section.lead {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(160deg, var(--bd-blauw) 0%, var(--bd-lichtblauw) 100%);
    color: var(--bd-wit);
    text-align: left;
    padding: 80px 96px;
  }
  section.lead h1 {
    color: var(--bd-wit);
    font-size: 52px;
    border-bottom: 3px solid rgba(255,255,255,0.4);
    margin-bottom: 16px;
  }
  section.lead h2 {
    color: rgba(255,255,255,0.85);
    font-size: 28px;
    border: none;
    font-weight: 400;
    margin-bottom: 32px;
  }
  section.lead p {
    color: rgba(255,255,255,0.75);
    font-size: 18px;
  }
  section.lead strong {
    color: var(--bd-wit);
  }

  /* ── Sectietiteldia ── */
  section.sectie {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: linear-gradient(135deg, var(--bd-blauw) 60%, #0054a8 100%);
    color: var(--bd-wit);
    padding: 60px 96px;
  }
  section.sectie h1 {
    color: var(--bd-wit);
    font-size: 48px;
    border-bottom: 3px solid rgba(255,255,255,0.35);
  }
  section.sectie h2 {
    color: var(--bd-wit);
    border-bottom-color: rgba(255,255,255,0.3);
  }
  section.sectie p {
    color: rgba(255,255,255,0.8);
    font-size: 22px;
  }

  /* ── Twee kolommen ── */
  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 36px;
    align-items: start;
  }
  .columns-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 24px;
    align-items: start;
  }

  /* ── Kaarten / boxes ── */
  .card {
    background: var(--bd-wit);
    border-left: 4px solid var(--bd-lichtblauw);
    border-radius: 4px;
    padding: 16px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  }
  .card-accent {
    background: var(--bd-wit);
    border-left: 4px solid var(--bd-accent);
    border-radius: 4px;
    padding: 16px 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  }
  .card h3 { margin-top: 0; }

  /* ── Highlight-box ── */
  .highlight {
    background: #e8f0fe;
    border: 1px solid #b8d0f8;
    border-radius: 6px;
    padding: 14px 20px;
    margin: 12px 0;
  }
  .highlight-oranje {
    background: #fff4e6;
    border: 1px solid #ffc875;
    border-radius: 6px;
    padding: 14px 20px;
    margin: 12px 0;
  }

  /* ── Vergelijkingstabel ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 19px;
  }
  th {
    background: var(--bd-blauw);
    color: var(--bd-wit);
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
  }
  td {
    padding: 9px 14px;
    border-bottom: 1px solid #dde3ec;
  }
  tr:nth-child(even) td { background: #eef2f9; }
  tr:nth-child(odd)  td { background: var(--bd-wit); }

  /* ── Code ── */
  code {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.88em;
    background: #e8ecf5;
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--bd-blauw);
  }
  pre {
    background: #1e2a3a;
    border-radius: 6px;
    padding: 20px 24px;
    font-size: 17px;
    line-height: 1.55;
    overflow: hidden;
  }
  pre code {
    background: none;
    color: #e8f0fe;
    padding: 0;
  }

  /* ── Lijsten ── */
  ul { padding-left: 28px; }
  li { margin-bottom: 8px; line-height: 1.5; }
  li::marker { color: var(--bd-lichtblauw); }

  /* ── Labels / badges ── */
  .badge {
    display: inline-block;
    background: var(--bd-lichtblauw);
    color: white;
    font-size: 13px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    margin-right: 6px;
  }
  .badge-groen {
    background: #2e7d32;
  }
  .badge-oranje {
    background: var(--bd-accent);
  }

  /* ── Pijl-stappen ── */
  .stappen {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin: 16px 0;
  }
  .stap {
    background: var(--bd-blauw);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
  }
  .pijl { color: var(--bd-lichtblauw); font-size: 22px; font-weight: bold; }

  /* ── Geen header/footer op titeldia ── */
  section.lead header,
  section.lead footer,
  section.lead::after,
  section.sectie header,
  section.sectie footer,
  section.sectie::after { display: none; }

  /* ── Agenda-slide ── */
  section.agenda ol {
    counter-reset: agenda-counter;
    list-style: none;
    padding: 0;
  }
  section.agenda ol li {
    counter-increment: agenda-counter;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 7px 0;
    border-bottom: 1px solid #dde3ec;
    font-size: 21px;
  }
  section.agenda ol li::before {
    content: counter(agenda-counter);
    background: var(--bd-blauw);
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 15px;
    flex-shrink: 0;
  }
---

<!-- _class: lead -->
<!-- _backgroundColor: #003082 -->

# Automatische Wetsanalyse<br>met JAS + MCP

## Van wetgeving naar kennismodel

Een workflow die de Invorderingswet 1990 — en elke andere Nederlandse wet — automatisch annoteert, ontleedt en documenteert.

**Wettenbank MCP + JAS v1.0.10 + Claude Code** &nbsp;|&nbsp; Belastingdienst, Domein Inning

---

<!-- _class: agenda -->

## Agenda

0. Context — AI, kenniswerkers en de Belastingdienst
1. Het probleem — waarom handmatig niet schaalbaar is
2. De oplossing — een end-to-end workflow
3. Wettenbank MCP — toegang tot wetten.overheid.nl
4. Technische architectuur van de MCP-server
5. JAS — Juridisch Analyseschema v1.0.10
6. De JAS-workflow stap voor stap
7. Concreet resultaat — Art. 9 IW 1990
8. Meerwaarde handmatig vs. geautomatiseerd
9. Projectstructuur en volgende stappen

---

## AI en kenniswerkers — de kloof

![bg right:52% contain](anthropic-ai-labor-impact.png)

**Bron:** Anthropic, *Economic and Labor Market Impacts* (2025)

Het onderzoek meet voor 20+ beroepscategorieën:
- **Blauw** — theoretische AI-dekking (wat _kan_)
- **Rood** — daadwerkelijke AI-adoptie (wat _gebeurt_)

<div class="highlight-oranje">

**Legal** scoort een van de hoogste theoretische dekkingen van alle categorieën — maar de werkelijke adoptie loopt ver achter. De kloof is het grootst in kennisintensieve juridische domeinen.

</div>

---

## Wat betekent dit voor de Belastingdienst?

<div class="columns">
<div>

### Het potentieel is er
Juridische analyse — wetsteksten lezen, kruisverwijzingen volgen, begrippen definiëren, rekenregels formaliseren — past precies in het profiel van taken waar AI-ondersteuning het meest effectief is.

### De uitdaging
Juridische kwaliteitseisen zijn streng: letterlijk citeren, bronvermelding, traceerbare interpretatie. Generieke AI-tools voldoen hier niet aan zonder aanvullende structuur.

</div>
<div>

<div class="card-accent">

### Dit project
Sluit die kloof voor **Domein Inning**:

- **Wettenbank MCP** zorgt dat de AI directe, actuele toegang heeft tot de echte wetstekst
- **JAS-workflow** dwingt af dat analyses volledig, traceerbaar en gestandaardiseerd zijn
- **CLAUDE.md** configureert de AI als senior jurist — elke sessie opnieuw

Het resultaat is AI-assistentie die voldoet aan de juridische kwaliteitseisen van de Belastingdienst.

</div>

</div>
</div>

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 1
## Het probleem & de oplossing

---

## Het probleem

Een artikel van de Invorderingswet grondig analyseren vraagt om:

<div class="columns">
<div>

### Handmatig opzoekwerk
- Wetstekst lezen en kruisverwijzingen volgen
- Leidraad Invordering erbij raadplegen
- Awb-toepasselijkheid controleren via art. 1 lid 2 IW 1990
- Externe wetten opzoeken (AWR, Awb, Wet BPM…)

</div>
<div>

### Structureel documenteren
- Termijnen en parameters destilleren
- Afleidingsregels en formules opstellen
- Beslisregels uitschrijven
- Lacunes en spanningsvelden benoemen

</div>
</div>

<div class="highlight-oranje">

**Resultaat zonder tooling:** de analyse kosten per artikel meer tijd en is deze minder consistent, reproduceerbaar en gestandaardiseerd.
</div>

---

## De oplossing

<div class="stappen">
  <div class="stap">/jas commando</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">Wettenbank MCP haalt wetstekst op</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">JAS-annotatie door Claude Code</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">Rapport ~4 000 woorden</div>
</div>

<div class="columns">
<div class="card">

### Wettenbank MCP
Haalt wetsteksten **direct van wetten.overheid.nl** — geen API-sleutel, CC-0 data. Specifieke artikelen, peildatums, historische versies, volledige zoekfunctionaliteit.

</div>
<div class="card">

### JAS v1.0.10
Classificeert elk zinsdeel in **13 gestandaardiseerde elementen** (MinBZK-standaard, Hohfeld-taxonomie). Interpretatiemethode, delegatieketens, rekenregels — allemaal traceerbaar.

</div>
</div>

<div class="highlight">

Het commando `/jas art9-iw1990` levert in minuten een volledig rapport op: kruisreferenties, parameters, beslisregels, beleidsanalyse, juridische analyse, lacunes en conclusie. **~7 000 woorden.**

</div>

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 2
## Wettenbank MCP

---

## Wat is de Wettenbank MCP?

**MCP** staat voor *Model Context Protocol* — een open standaard waarmee een AI-assistent op een gestructureerde manier externe tools en databronnen kan raadplegen. De Wettenbank MCP is een zelfgebouwde MCP-server in TypeScript die Claude Code drie tools biedt:

| Tool | Doel | Voorbeeld |
|------|------|-----------|
| `wettenbank_zoek` | Vind wetten op naam, rechtsgebied, type | Zoek alle AMvB's onder IW 1990 |
| `wettenbank_ophalen` | Haal wet of specifiek artikel op; zoek termen; historische versies via peildatum | `artikel="9"`, `bwbId="BWBR0004770"` |
| `wettenbank_wijzigingen` | Gewijzigde regelingen sinds datum X | Impact-analyse bij wetswijziging |

<div class="columns">
<div class="card">

**Geen API-sleutel nodig**
Publieke SRU-interface van KOOP (Kennis- en exploitatiecentrum Officiële Overheidspublicaties). Alle data is CC-0.

</div>
<div class="card">

**Historische versies**
Elke aanroep retourneert een **peildatum**. Versies raadpleegbaar tot ver voor de datum van vandaag — essentieel voor wijzigingsanalyse.

</div>
</div>

---

## Technische architectuur

```
Claude Code  (JSON via stdio / MCP-protocol)
     |
     v
wettenbank-mcp  (TypeScript, src/index.ts)
     CQL-query bouwen → SRU-aanroep → XML parseren → Markdown
     |
     +-- zoekservice.overheid.nl        (SRU 2.0 — zoeken + metadata)
     +-- repository.officiele-overheidspublicaties.nl  (BWB-toestand XML)
```

<div class="columns">
<div class="card">

**Transport: StdIO**
Claude Desktop of Claude Code start de server als subprocess en wisselt JSON uit via stdin/stdout. Geen poort, geen HTTP.

</div>
<div class="card">

**Historische versies**
Elke aanroep retourneert een **peildatum**. Versies zijn opvraagbaar op elke datum — essentieel voor wijzigingsanalyse en juridische reproduceer­baarheid.

</div>
</div>

---

## Data pipeline: wettenbank\_ophalen

<div class="stappen">
  <div class="stap">1. SRU-request</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">2. Metadata</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">3. BWB XML</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">4. DOM-traversal</div>
  <div class="pijl">&#8594;</div>
  <div class="stap">5. Markdown</div>
</div>

<div class="columns">
<div>

**Stap 1–2: Zoeken**
`sruRequest()` stuurt een CQL-query. `parseRecords()` extraheert het `Regeling`-object inclusief repository-URL.

**Stap 3: Ophalen**
`fetch(repoUrl)` haalt de volledige BWB-toestand XML op (conform `toestand_2016-1.xsd`).

</div>
<div>

**Stap 4: Parsen**
`wetParser.parse()` bouwt een DOM. De `isArray`-configuratie is gebaseerd op de XSD: elementen met `maxOccurs="unbounded"` (artikel, lid, li…) worden als array behandeld.

**Stap 5: Formatteren**
`zoekArtikelInDom()` vindt de juiste node. `formateerArtikelNode()` formatteert als markdown. Fallback op regex bij parsefouten.

</div>
</div>

---

## Gerichte artikelophaling

<div class="columns">
<div class="card">

### Waarom niet altijd de volledige wet ophalen?
Grote wetten (Awb, IW 1990) produceren bij volledige opvraging honderden pagina's tekst. Dat vult het contextvenster van de AI en maakt gerichte analyse traag en foutgevoelig.

</div>
<div class="card-accent">

### De `artikel`-parameter
Haalt **één XML-node** op uit de BWB-toestand, ongeacht de wetgrootte. Efficiënt, precies en werkt voor alle wetten — ook de Awb die uit honderden artikelen bestaat.

</div>
</div>

<br>

**Twee-staps zoeken** (`titel` + `trefwoord` samen):

```
Stap 1: SRU-query op titel → BWB-id ophalen
Stap 2: Volledige tekst downloaden → trefwoord zoeken met contextfragmenten
```

> De SRU-interface doorzoekt met `trefwoord` alleen metadata, niet de wetstekst zelf. De twee-staps aanpak omzeilt dit.

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 3
## JAS — Juridisch Analyseschema

---

## Wat is JAS?

<div class="columns">
<div>

### 13 elementen

<span class="badge" style="background:#4472C4;color:#fff">rechtssubject</span>
<span class="badge" style="background:#70AD47;color:#fff">rechtsobject</span>
<span class="badge" style="background:#FF0000;color:#fff">rechtsbetrekking</span>
<span class="badge" style="background:#FFC000;color:#333">rechtsfeit</span>
<span class="badge" style="background:#7030A0;color:#fff">voorwaarde</span>
<span class="badge" style="background:#00B0F0;color:#333">afleidingsregel</span>
<span class="badge" style="background:#92D050;color:#333">variabele/waarde</span>
<span class="badge" style="background:#FFD966;color:#333">parameter/waarde</span>
<span class="badge" style="background:#808080;color:#fff">operator</span>
<span class="badge" style="background:#F4B942;color:#333">tijdsaanduiding</span>
<span class="badge" style="background:#9DC3E6;color:#333">plaatsaanduiding</span>
<span class="badge" style="background:#C9C9C9;color:#333">delegatiebevoegdheid</span>
<span class="badge" style="background:#D6B4C8;color:#333">brondefinitie</span>

</div>
<div>

### Juridisch Analyseschema v1.0.10

Standaard van het Ministerie van BZK (2024), gebaseerd op de juridische categorietheorie van Hohfeld.

Per element vastleggen:
1. **Grammaticale** interpretatie — letterlijke betekenis
2. **Systematische** interpretatie — samenhang met andere bepalingen
3. **Teleologische** interpretatie — ratio legis

Elk zinsdeel wordt **letterlijk geciteerd** — nooit geparafraseerd.

</div>
</div>

---

## De JAS-workflow: stap 0 tot 8

| Stap | Actie | Inhoud |
|------|-------|--------|
| **0** | Controleren | Bestaande annotatie in `analyses/` opzoeken — peildatum vergelijken |
| **1** | Parsen | Artikelnummer A, wet W, BWB-id B en begripsbepalings-artikel BD bepalen |
| **2** | Parallel ophalen | Artikel A + begripsbepalingen BD tegelijk via MCP — noteer peildatum |
| **3** | IW-context | Art. 1 lid 2 IW 1990 (Awb-uitsluitingsclausule) + Leidraad Invordering art. A |
| **4** | Kruisreferenties | Interne + externe verwijzingen extraheren en parallel ophalen |
| **5** | Annoteren | 13 JAS-elementen doorlopen — annotatietabel per lid opstellen |
| **6** | Afleidingsregels | Beslisregels, rekenregels en parameters formaliseren |
| **7** | Awb-check | Toepasselijkheidscheck o.b.v. art. 1 lid 2 IW 1990 (conditioneel) |
| **8** | Opslaan | Timestamp ophalen — rapport als `.md` in `analyses/` bewaren |

<div class="highlight">

Stap 3 is conditioneel voor IW 1990 én UB IW 1990; stap 7 uitsluitend voor de Invorderingswet 1990. Stap 2 en 4 worden parallel uitgevoerd via gelijktijdige MCP-aanroepen.

</div>

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 4
## Concreet resultaat: Art. 9 IW 1990

---

## Voorbeeld: Art. 9 IW 1990 — Betalingstermijnen

Artikel 9 IW 1990 regelt wanneer een belastingaanslag invorderbaar is. **12 leden, 57 annotaties.**

<div class="columns">
<div>

### Fragment annotatietabel

| Nr | Formulering | JAS-element |
|----|-------------|-------------|
| 1 | "belastingaanslag" | **Rechtsobject** |
| 2 | "is invorderbaar" | **Rechtsbetrekking** |
| 3 | "zes weken" | **Parameter** |
| 4 | "na de dagtekening" | **Tijdsaanduiding** |
| 5 | "In afwijking van het eerste lid" | **Afleidingsregel** |
| 6 | "een navorderingsaanslag" | **Rechtsobject** |

</div>
<div>

### Kwantitatieve output

<div class="card">

- **14 beslisregels**
- **3 rekenregels** (N = 12 − M; N = 13 − M; N = 12 vast)
- **8 parameters** (6 weken, 1 maand, 14 dagen, 10 dagen, 15 dagen, 16 maart, 5 jaar, 1 maand tussenpozen)
- **4 interne** kruisverwijzingen (naar art. 2 IW 1990)
- **4 externe** wetten geraadpleegd (Wet BPM 1992, Wet ZMR, DWU, Algemene termijnenwet)
- **4 spanningsvelden** geïdentificeerd
- **3 lacunes** gedocumenteerd

</div>

</div>
</div>

---

## Rapport-structuur: 11 secties + 2 bijlagen

<div class="columns">
<div>

| Sectie | Inhoud |
|--------|--------|
| §1 | Wetstekst (letterlijk citaat) |
| §2 | Structuurdiagram lid-relaties |
| §3 | Brondefinities |
| §4 | JAS-annotatie per lid |
| §5 | Afleidingsregels & rekenstructuur |
| §6 | Termijnen en tijdsaanduidingen |

</div>
<div>

| Sectie | Inhoud |
|--------|--------|
| §7 | Kruisreferenties intern + extern + Awb |
| §8 | Beleidskader Leidraad Invordering |
| §9 | Juridische analyse gram./syst./teleologisch |
| §10 | Lacunes en ontbrekend beleid |
| §11 | Conclusie + onzekerheden |
| A–B | Geraadpleegde artikelen + bronnen |

</div>
</div>

<div class="highlight">

Rapport Art. 9 IW 1990: **~7 300 woorden**, automatisch gegenereerd, opgeslagen als `analyses/jas-annotatie-art9-IW1990-2026-04-04_21-19-24.md`. Volledig traceerbaar, versiebaar en navolgbaar.

</div>

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 5
## Meerwaarde & volgende stappen

---

## Handmatig vs. geautomatiseerd

| Aspect | Handmatig | Met workflow |
|--------|-----------|--------------|
| Doorlooptijd per artikel | Uren | Minuten |
| Kruisverwijzingen | Handmatig volgen | Automatisch geëxtraheerd en opgezocht |
| Rekenregels & parameters | Impliciet of ongedocumenteerd | Geformaliseerd met formule en voorbeeld |
| Awb-toepasselijkheidscheck | Ad-hoc | Systematisch o.b.v. art. 1 lid 2 IW 1990 |
| Leidraad Invordering | Soms geraadpleegd | Altijd geciteerd in §8 |
| Reproduceerbaarheid | Laag | Volledig traceerbaar, opgeslagen als MD |
| Kwaliteitsconsistentie | Afhankelijk van analist | 14 vaste kwaliteitseisen, geen parafrase |
| Versie-informatie | Ontbreekt vaak | Peildatum uit MCP, altijd vermeld |

---

## Projectstructuur

```
wetten overheid/
├── wettenbank-mcp/           # TypeScript MCP-server
│   ├── src/index.ts          # 1 bestand, 632 regels
│   ├── src/index.test.ts     # Vitest unit tests
│   └── package.json
│
├── analyses/                 # Gegenereerde rapporten
│   └── jas-annotatie-art9-IW1990-2026-04-04_21-19-24.md
│
├── presentaties/             # Deze presentatie
│
├── CLAUDE.md                 # Werkafspraken + BWB-quickref
├── jas-kaders.md             # JAS v1.0.10 — 13 elementen + herkenningsvragen
├── jas-workflow.md           # Volledige workflow-documentatie
└── .claude/commands/
    ├── jas.md                # /jas commando (artikel-annotatie)
    └── wetzoek.md            # /wetzoek commando (termanalyse)
```

---

## Volgende stappen

<div class="columns-3">
<div class="card">

### Meer wetten & monitoring
De workflow is generiek — elke wet met BWB-id (AWR, Awb, Successiewet, Wet WOZ). Gebruik `wettenbank_wijzigingen` voor automatische impact-analyse bij wetswijzigingen.

</div>
<div class="card">

### Kennismodel genereren
JAS-annotaties zijn directe invoer voor een ICT-kennismodel. Beslisregels, rekenregels en parameters zijn al geformaliseerd en klaar voor implementatie.

</div>
<div class="card-accent">

### Samenwerking & tooling
Rapporten zijn Markdown — versiebaar in Git, deelbaar en peer-reviewbaar. De MCP-server werkt ook in **Claude Desktop** en **Gemini CLI** zonder aanpassingen.

</div>
</div>

---

<!-- _class: lead -->
<!-- _backgroundColor: #003082 -->

# Vragen & Demo

## Live demo: /jas art25-iw1990

Een artikel annoteren in real-time — van wetstekst naar volledig rapport.

**Belastingdienst — Domein Inning**
