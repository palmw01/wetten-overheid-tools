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

<!--
Wat je zegt:
"Ik ga jullie laten zien hoe je met een combinatie van drie dingen — een zelfgebouwde MCP-server, een gestandaardiseerd annotatieschema en Claude Code — een Nederlandse wet volledig en gestructureerd kunt annoteren. Sneller dan handmatig, consistenter dan ad hoc, en volledig traceerbaar."

Achtergrond:
- Het project is gebouwd voor Domein Inning van de Belastingdienst, maar de workflow is generiek en werkt voor elke wet met een BWB-id.
- De drie componenten versterken elkaar: MCP zorgt voor betrouwbare data, JAS voor vaste structuur, Claude Code voor de uitvoering en het geheugen (CLAUDE.md).
- De titel "Van wetgeving naar kennismodel" verwijst naar het eindresultaat: JAS-annotaties zijn directe invoer voor ICT-kennismodellen (RegelSpraak, DMN).
-->

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
7. Skills-architectuur — token-isolatie via context:fork
8. Concreet resultaat — Art. 9 IW 1990
9. Meerwaarde handmatig vs. geautomatiseerd
10. Projectstructuur en volgende stappen

<!--
Wat je zegt:
"We beginnen met de 'waarom' — het Anthropic-onderzoek dat laat zien hoe groot de kloof is tussen wat AI voor juridische kenniswerkers kán doen en wat er feitelijk gebeurt. Dan de oplossing, de techniek, en een concreet voorbeeld aan het einde inclusief een live demo."

Achtergrond:
- Agendapunt 0 ("Context") staat bewust los: het is het motiverende kader, geen onderdeel van de technische oplossing.
- De demo aan het einde (Art. 25 IW 1990, uitstel van betaling) is bewust een ander artikel dan het voorbeeld in de presentatie (Art. 9), zodat de live-run niet als "trucje" overkomt.
-->

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

<!--
Wat je zegt:
"Anthropic heeft gemeten hoeveel van het werk in meer dan twintig beroepscategorieën theoretisch door AI ondersteund kan worden, en hoeveel er in de praktijk ook echt zo wordt gebruikt. Legal zit in de top qua potentieel — maar de adoptie is laag. Dat is precies de kloof die dit project wil dichten."

Achtergrond:
- Het rapport heet "Economic and Labor Market Impacts" (Anthropic, 2025). Het is gepubliceerd als onderdeel van bredere discussie over AI en de arbeidsmarkt.
- "Theoretische dekking" = percentage van taken in een beroep dat binnen de huidige technische capaciteit van AI valt (taakdecompositie-methode).
- "Werkelijke adoptie" = gebruik gemeten via surveys en gedragsdata.
- De kloof in legal is groot omdat juridische kwaliteitseisen (bronvermelding, letterlijk citeren, traceerbare interpretatie) generieke AI-tools niet automatisch vervullen — ze moeten worden afgedwongen via structuur zoals JAS.
- Als iemand vraagt naar de bron: Anthropic publiceerde dit in 2025; de exacte titel en URL staan op de dia.
-->

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

<!--
Wat je zegt:
"Juridische analyse past perfect bij wat AI goed kan: tekst lezen, verwijzingen volgen, begrippen definiëren. De uitdaging is kwaliteitsborging. Generieke AI hallucineert, parafraseert, en vergeet bronnen te vermelden. Dit project lost dat op met drie lagen: de MCP-server voor betrouwbare data, JAS voor de structuur, en CLAUDE.md als geheugen van de AI."

Achtergrond:
- CLAUDE.md is een configuratiebestand dat Claude Code bij elke sessie inleest. Het bevat werkafspraken, BWB-ids van kernwetten, zoekstrategie en kwaliteitseisen. Dit is wat ervoor zorgt dat de AI zich gedraagt als een "senior jurist" — niet via finetuning, maar via instructies.
- De drie pilaren zijn bewust ontkoppeld: de MCP-server werkt ook met Gemini of andere AI-tools; JAS is een document-standaard die ook handmatig bruikbaar is; Claude Code is vervangbaar door een andere AI-assistent.
- "Domein Inning" is de afdeling van de Belastingdienst die verantwoordelijk is voor de invordering van rijksbelastingen — betaling, uitstel, beslag, aansprakelijkheid, kwijtschelding.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 1
## Het probleem & de oplossing

<!--
Wat je zegt:
"Laten we beginnen met het probleem dat we proberen op te lossen."
-->

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

<!--
Wat je zegt:
"Een artikel van de Invorderingswet grondig analyseren is arbeidsintensief. Je moet de tekst lezen, kruisverwijzingen volgen — soms drie of vier niveaus diep — de Leidraad Invordering erbij raadplegen, en dat alles documenteren in een consistent format. Zonder tooling kost dat per artikel uren, en het resultaat is niet reproduceerbaar."

Achtergrond:
- Art. 1 lid 2 IW 1990 is de zogeheten "uitsluitingsclausule": het bepaalt welke bepalingen van de Awb van toepassing zijn op de invordering. Dit artikel moet bij elk IW-artikel worden gecheckt.
- De Leidraad Invordering is een beleidsregel (geen wet) die de Belastingdienst zelf uitgeeft. Hij vult de IW 1990 in op uitvoerend niveau — tarieven, termijnen, bevoegdheden. BWB-id: BWBR0024096.
- "Rekenregels formaliseren" verwijst naar het vastleggen van formules zoals termijnberekeningen (bijv. Art. 9: termijn = 6 weken na dagtekening aanslag, met uitzonderingen).
-->

---

## De oplossing

<div class="stappen">
  <div class="stap">/jas skill</div>
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

De skill `/jas art9-iw1990` levert in minuten een volledig rapport op: kruisreferenties, parameters, beslisregels, beleidsanalyse, juridische analyse, lacunes en conclusie. **~7 000 woorden.**

</div>

<!--
Wat je zegt:
"De oplossing is één skill: /jas gevolgd door het artikelnummer. Die skill triggert de MCP-server om de wetstekst op te halen, geeft die aan Claude Code met de JAS-instructies, en een paar minuten later ligt er een rapport van circa 7000 woorden klaar. Volledig traceerbaar, opgeslagen als Markdown. De executie vindt plaats in een geïsoleerde context — de hoofdconversatie ziet alleen het bestandspad."

Achtergrond:
- /jas is een skill in Claude Code — een herbruikbaar promptmodule die in een geïsoleerde context (`context: fork`) wordt uitgevoerd. De werkwijze staat in `.claude/skills/jas/SKILL.md`, de taxonomie in `kaders.md` en het rapportformat in `rapportformat.md`.
- "CC-0 data" betekent dat de inhoud van wetten.overheid.nl rechtenvrij is (publiek domein). Er zijn geen licentiekosten of beperkingen voor gebruik.
- De output van ~4000 woorden voor Art. 9 is representatief; complexere artikelen (meer leden, meer verwijzingen) kunnen groter uitpakken.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 2
## Wettenbank MCP

<!--
Wat je zegt:
"Dan de technische kern: de Wettenbank MCP-server."
-->

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

<!--
Wat je zegt:
"MCP — Model Context Protocol — is een open standaard van Anthropic waarmee een AI-assistent op een gestructureerde manier externe tools en databronnen kan aanroepen. Vergelijk het met een API-laag tussen de AI en de buitenwereld. De Wettenbank MCP is een zelfgebouwde server in TypeScript die Claude Code drie tools geeft: zoeken, ophalen en wijzigingen monitoren."

Achtergrond:
- MCP is in 2024 gestandaardiseerd door Anthropic en wordt inmiddels ook ondersteund door andere AI-tools (Cursor, Gemini). Het protocol gebruikt JSON-RPC via stdio of HTTP.
- KOOP staat voor Kennis- en exploitatiecentrum Officiële Overheidspublicaties — de organisatie die wetten.overheid.nl beheert. Ze bieden een SRU 2.0-interface (Search/Retrieve via URL) aan, een bibliotheekstandaard voor zoekopdrachten.
- SRU (Search/Retrieve via URL) is een internationale bibliotheekstandaard (Z39.50-familie) voor het doorzoeken van metadatacatalogi. De Wettenbank MCP gebruikt dit als basis.
- wettenbank_wijzigingen is handig voor impact-analyse: als art. 9 IW 1990 wijzigt, kun je automatisch alle annotaties flaggen die mogelijk verouderd zijn.
- CC-0 data: alle overheidspublicaties op wetten.overheid.nl vallen onder de open licentie van KOOP — hergebruik zonder beperkingen.
-->

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

<!--
Wat je zegt:
"De architectuur is opzettelijk simpel. Claude Code start de MCP-server als een subprocess en wisselt JSON-berichten uit via stdin en stdout — geen netwerk, geen poorten. De server vertaalt die aanvragen naar CQL-queries richting de SRU-interface van de overheid, haalt de XML op, parsed die, en geeft Markdown terug."

Achtergrond:
- StdIO-transport is de eenvoudigste MCP-transportmodus: de AI en de server draaien op dezelfde machine en communiceren via standaard input/output. Alternatief is HTTP/SSE voor remote servers.
- CQL (Contextual Query Language) is de querytaal van SRU. Voorbeelden: dcterms.identifier = BWBR0004770 om een specifieke wet op te zoeken.
- De BWB-toestand XML is het formaat waarin wetten.overheid.nl de actuele versie van een wet aanbiedt. Het schema (toestand_2016-1.xsd) is openbaar en definieert de structuur van artikelen, leden en onderdelen.
- Historische versies zijn opvraagbaar door een datum mee te geven in de SRU-aanroep. Dit is essentieel voor juridische reproduceerbaarheid: een analyse op peildatum 2024-01-01 moet later nog verifieerbaar zijn.
-->

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

<!--
Wat je zegt:
"De volledige datapipeline van aanvraag tot Markdown in vijf stappen. Het meest interessante is stap 4: de XML-parser is geconfigureerd op basis van het XSD-schema van de overheid. Elementen die meerdere keren kunnen voorkomen — artikelen, leden, lijstitems — worden als array behandeld. Dat maakt de DOM-traversal betrouwbaar."

Achtergrond:
- DOM-traversal in dit geval is XML DOM — de parser bouwt een boomstructuur van de wet en de code loopt die boom af op zoek naar het juiste artikelelement.
- maxOccurs="unbounded" in XSD betekent dat een element nul of meer keer mag voorkomen. Zonder die configuratie zou de XML-parser soms een enkelvoudig element als object teruggeven en soms als array, wat de code zou breken.
- De regex-fallback is een vangnet voor gevallen waar de XML-structuur afwijkt van het verwachte schema (zeldzaam, maar het komt voor bij oudere wetten).
- wetParser.parse() is een interne functie in src/index.ts — het kernbestand van 633 regels dat de hele server implementeert.
-->

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

<!--
Wat je zegt:
"Dit is een praktisch punt dat de betrouwbaarheid van de tool sterk beïnvloedt. De Awb heeft meer dan 300 artikelen — als je die volledig ophaalt, vult dat het contextvenster van de AI. Dat leidt tot afgeknotte tekst en missende informatie. De `artikel`-parameter haalt precies één XML-node op, ongeacht hoe groot de wet is."

Achtergrond:
- Een contextvenster van een AI-model heeft een maximale capaciteit in tokens (circa 200.000 voor Claude). De volledige Awb in tekst overschrijdt dat ruimschoots. Gerichte opvraging is daarom geen luxe maar noodzaak.
- De SRU-interface doorzoekt metadata, niet de wetstekst zelf. Dat is een beperking van het zoeksysteem van KOOP. De twee-staps aanpak (eerst BWB-id ophalen via metazoekopdracht, dan wetstekst doorzoeken via regex) omzeilt dit.
- Dit is ook de reden waarom in CLAUDE.md expliciet staat: gebruik altijd wettenbank_ophalen voor inhoudelijke zoekopdrachten, nooit wettenbank_zoek met alleen een trefwoord.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 3
## JAS — Juridisch Analyseschema

<!--
Wat je zegt:
"Dan het tweede onderdeel: JAS — het Juridisch Analyseschema."
-->

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

<!--
Wat je zegt:
"JAS is een standaard van het Ministerie van BZK uit 2024, gebaseerd op de juridische categorietheorie van Hohfeld. Het classificeert elk zinsdeel van een wetsbepaling in een van dertien elementen — van rechtssubject en rechtsbetrekking tot delegatiebevoegdheid en parameter. Het bijzondere is dat elk element via drie methoden wordt geïnterpreteerd: grammaticaal, systematisch en teleologisch."

Achtergrond:
- Wesley Newcomb Hohfeld (1879–1918) was een Amerikaanse jurist die een taxonomie ontwikkelde voor juridische relaties: rechten, plichten, bevoegdheden, immuniteiten — en hun correlatieven en tegengestelden. JAS bouwt hierop voort.
- MinBZK-standaard: het Ministerie van Binnenlandse Zaken en Koninkrijksrelaties werkt aan de digitalisering van wetgeving via het programma Wetsanalyse en -implementatie. JAS is een uitkomst van dat werk.
- Grammaticale interpretatie: wat zegt de tekst letterlijk?
  Systematische interpretatie: hoe verhoudt dit artikel zich tot andere bepalingen in dezelfde wet of verwante wetten?
  Teleologische interpretatie: wat was het doel van de wetgever (ratio legis)?
- "Elk zinsdeel wordt letterlijk geciteerd" is een bewuste kwaliteitseis: parafrase introduceert interpretatiebias. De AI mag niet samenvatten — alleen citeren en labelen.
- De kleuren van de badges zijn gebaseerd op de officiële JAS-kleurcodering uit `.claude/skills/jas/kaders.md`.
-->

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

<!--
Wat je zegt:
"De workflow heeft negen stappen. Stap 0 is hergebruik: als er al een annotatie bestaat in de analyses/-map wordt die eerst gecontroleerd op peildatum. Stap 2 en 4 worden parallel uitgevoerd — dat scheelt tijd. Stap 3 en 7 zijn conditioneel: die Awb-check is alleen relevant bij de Invorderingswet en het Uitvoeringsbesluit, niet bij andere wetten."

Achtergrond:
- Stap 0 — Hergebruik: Voorkomen dat een al bestaande analyse opnieuw wordt gemaakt bij hetzelfde artikel. De bestandsnaam bevat een timestamp, waarmee je kunt zien of de peildatum nog actueel is.
- Art. 1 lid 2 IW 1990 (stap 3 en 7): dit lid bepaalt dat de Awb van toepassing is op de invordering, tenzij de IW 1990 anders bepaalt. Het is dus de sleutelcruciale bepaling voor Awb-toepasselijkheid — elke JAS-analyse van een IW-artikel moet hier langs.
- Leidraad Invordering (stap 3): de Leidraad is niet gecodificeerd in wet, maar is een beleidsregel die de Belastingdienst bindt. Per artikel van de IW 1990 bestaat een corresponderende sectie in de Leidraad.
- Stap 6 — Formaliseren: Beslisregels worden geschreven als IF [voorwaarde] THEN [rechtsgevolg], rekenregels als formules (bijv. Termijn = 6 weken na dagtekening). Dit is directe invoer voor ICT-kennismodellen.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 4
## Skills-architectuur

<!--
Wat je zegt:
"Voordat we het concrete resultaat bekijken, een toelichting op de manier waarop de workflow technisch is georganiseerd — en waarom dat uitmaakt."
-->

---

## Skills: modulaire opbouw met token-isolatie

```
.claude/skills/
├── jas/
│   ├── SKILL.md         # werkwijze: stap 0–10, MCP-strategie, Leidraad-mapping
│   ├── kaders.md        # JAS v1.0.10 — 13 elementen + taxonomie
│   └── rapportformat.md # §1–§11 structuur + pre-save checklist
└── wetzoek/
    ├── SKILL.md         # werkwijze: stap 0–9, morfologische varianten
    └── rapportformat.md # §1–§5 structuur + pre-save checklist
```

<div class="columns">
<div class="card">

### Progressive disclosure
Elk bestand heeft één verantwoordelijkheid. De skill laadt bij aanvang werkwijze + format — domeinkennis staat apart en wordt alleen geladen wanneer nodig.

</div>
<div class="card-accent">

### `context: fork`
De volledige executie — MCP-aanroepen, wetstekst, annotatie — vindt plaats in een **geïsoleerde context**. De hoofdconversatie ontvangt alleen het bestandspad van het opgeslagen rapport.

</div>
</div>

<!--
Wat je zegt:
"Elke skill bestaat uit drie gerichte bestanden: SKILL.md voor de werkwijze, kaders.md voor de domeinkennis, rapportformat.md voor de outputstructuur. Die bestanden worden alleen geladen op het moment dat je /jas of /wetzoek aanroept — niet bij elke conversatie. De executie vindt plaats in een geïsoleerde context via `context: fork`. De hoofdconversatie ontvangt daarna alleen het bestandspad van het rapport."

Achtergrond:
- `context: fork` is een frontmatter-sleutel in Claude Code skills. Het instrueert de harness om de skill als een subproces te draaien met een eigen contextvenster.
- Progressive disclosure: de skill laadt bij aanvang SKILL.md (werkwijze), kaders.md (taxonomie) en rapportformat.md (format). Die bestanden worden dus alleen geladen als de skill daadwerkelijk wordt uitgevoerd — niet bij elke conversatie.
- Token-effect: voor /jas betekent dit dat alle MCP-data en de annotatie zelf (~7000 woorden) niet in de hoofdcontext terechtkomen. Alleen het eindresultaat (bestandspad) komt terug.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 5
## Concreet resultaat: Art. 9 IW 1990

<!--
Wat je zegt:
"Laten we kijken wat dat concreet oplevert. Ik gebruik Art. 9 IW 1990 als voorbeeld — de betalingstermijnen."
-->

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

<!--
Wat je zegt:
"Art. 9 IW 1990 regelt wanneer een belastingaanslag invorderbaar is. Het heeft 12 leden. De workflow produceerde 57 annotaties, 14 beslisregels, 3 rekenregels, en identificeerde 4 spanningsvelden en 3 lacunes. Die lacunes zijn plekken waar de wet iets niet regelt maar dat logischerwijs wel zou moeten."

Achtergrond:
- Art. 9 IW 1990 in het kort: Een belastingaanslag is invorderbaar zes weken na de dagtekening van het aanslagbiljet (lid 1). Er zijn uitzonderingen: conserverende aanslagen, naheffingsaanslagen, enz. De latere leden regelen specifieke gevallen (motorrijtuigenbelasting, betalingstermijnen in termijnen, enz.).
- Beslisregel (BR): een IF-THEN-constructie die een juridische keuze formuleert. Voorbeeld: BR-1: ALS belastingaanslag is opgelegd DAN is de aanslag invorderbaar 6 weken na dagtekening.
- Rekenregel: een formule voor termijnberekening. Voorbeeld: N = 12 - M (bij betaling in maandelijkse termijnen: als aanslag in maand M wordt opgelegd, zijn nog 12-M termijnen beschikbaar).
- Spanningsveld: een bepaling die in spanning staat met een andere bepaling, bijvoorbeeld een kortere termijn in Art. 9 vs. een langere termijn in de Awb.
- Lacune: een situatie die de wet niet regelt maar logischerwijs zou moeten regelen — juridische leemte.
- De 4 interne kruisverwijzingen (§7.1) verwijzen alle naar art. 2 IW 1990 (definitiebepalingen). De 4 externe verwijzingen (§7.2) zijn naar: Wet BPM 1992, Wet belasting zware motorrijtuigen, het Douanewetboek van de Unie (EU-Vo.), en de Algemene termijnenwet (die art. 9 lid 10 uitdrukkelijk uitsluit).
-->

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

<!--
Wat je zegt:
"Het rapport volgt altijd dezelfde structuur: 11 secties en twee bijlagen. Dat maakt rapporten over verschillende artikelen vergelijkbaar. Sectie 1 is altijd de letterlijke wetstekst — geen parafrase, geen samenvatting. Sectie 9 bevat de juridische analyse via de drie interpretatiemethoden. Sectie 11 sluit af met conclusies en onzekerheden."

Achtergrond:
- De vaste structuur is bewust: het maakt peer-review mogelijk. Collega's die een rapport lezen weten waar ze moeten kijken voor specifieke informatie.
- §2 Structuurdiagram: een schematische weergave van de relaties tussen de leden van het artikel — welk lid een uitzondering vormt op welk lid, welk lid een definitie geeft.
- §8 Beleidskader: hier wordt de Leidraad Invordering geciteerd. Dit is de enige sectie waar beleidsregels (niet wet) aan bod komen — bewust gescheiden van de juridische analyse in §9.
- Bijlage A bevat alle geraadpleegde wetsteksten (letterlijk geciteerd met peildatum). Bijlage B bevat de bronnenlijst (MCP-aanroepen en resulterende documenten).
- Het rapport is opgeslagen als Markdown — dit maakt het versiebaar in Git, doorzoekbaar en bruikbaar als invoer voor andere tools.
-->

---

<!-- _class: sectie -->
<!-- _backgroundColor: #003082 -->

# Deel 6
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

<!--
Wat je zegt:
"De meerwaarde is op meerdere dimensies. Doorlooptijd is het meest zichtbaar — van uren naar minuten. Maar de andere dimensies zijn minstens zo waardevol: consistentie, reproduceerbaarheid, peildatumbeheer. Het rapport bevat altijd de datum waarop de wetstekst is opgehaald. Bij een wetswijziging weet je precies welke analyses zijn gebaseerd op de oude versie."

Achtergrond:
- "Vaste kwaliteitseisen" verwijst naar de pre-save checklist in `.claude/skills/jas/rapportformat.md`. Voorbeelden: letterlijk citeren (geen parafrase), alle 13 JAS-elementen beoordelen, peildatum uit MCP vermelden, alle kruisverwijzingen volgen. De checklist wordt doorlopen vóór elk rapport wordt opgeslagen.
- Reproduceerbaarheid is juridisch essentieel: als een rechter of bezwaarmaker vraagt op welke wettekst een besluit is gebaseerd, moet je dat kunnen aantonen. De peildatum in het rapport maakt dat mogelijk.
- Ad-hoc Awb-check vs. systematisch: zonder de workflow vergeten juristen soms te controleren of art. 1 lid 2 IW 1990 de Awb uitsluit of beperkt voor het specifieke geval. De workflow doet dit altijd.
-->

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
│   └── jas-annotatie-art9-IW1990-2026-04-08_09-57-10.md
│
├── presentaties/             # Deze presentatie
│
├── CLAUDE.md                 # Rol + betrouwbaarheidsregels (~30 regels)
└── .claude/skills/
    ├── jas/
    │   ├── SKILL.md          # /jas skill — werkwijze (context:fork)
    │   ├── kaders.md         # JAS v1.0.10 — 13 elementen + taxonomie
    │   └── rapportformat.md  # §1–§11 format + pre-save checklist
    └── wetzoek/
        ├── SKILL.md          # /wetzoek skill — werkwijze (context:fork)
        └── rapportformat.md  # §1–§5 format + pre-save checklist
```

<!--
Wat je zegt:
"De projectstructuur is compact. De MCP-server is één TypeScript-bestand van 633 regels. De gegenereerde rapporten komen in de analyses/-map. De instructies voor de AI zitten in CLAUDE.md en de twee command-bestanden. Dat is het."

Achtergrond:
- src/index.ts is de volledige MCP-server — bewust één bestand gehouden voor onderhoudbaarheid en leesbaarheid.
- src/index.test.ts bevat unit tests geschreven met Vitest (een moderne, snelle JavaScript-testrunner die compatibel is met de Vite-toolchain).
- CLAUDE.md is uitgedund van ~66 naar ~30 regels: MCP-strategie en BWB-ids zijn verhuisd naar de skills, die informatie is alleen nodig bij uitvoering van /jas of /wetzoek.
- .claude/skills/ bevat de skills — modulaire promptmodules die Claude Code uitvoert in een geïsoleerde context (context:fork). Elk skill-pakket bestaat uit drie lagen: werkwijze (SKILL.md), domeinkennis (kaders.md / rapportformat.md), en kwaliteitseisen.
- De pre-save checklist in rapportformat.md is een verplichte doorlooplijst vóór opslaan — garandeert dat alle secties zijn ingevuld en kwaliteitseisen zijn gehaald.
-->

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

<!--
Wat je zegt:
"Er zijn drie logische vervolgstappen. Ten eerste uitbreiden naar meer wetten — de workflow werkt al voor elke wet met een BWB-id. Ten tweede de JAS-output gebruiken als invoer voor een ICT-kennismodel. En ten derde samenwerking — de rapporten zijn Markdown, versiebaar in Git, en de MCP-server werkt ook in Claude Desktop en Gemini CLI."

Achtergrond:
- Kennismodel: De Belastingdienst en andere overheidsorganisaties werken aan formele kennismodellen van wetgeving — vaak in RegelSpraak (een Nederlandse regelspecificatietaal) of DMN (Decision Model and Notation). JAS-annotaties bevatten al de bouwstenen: beslisregels in IF-THEN-formaat, parameters met waarden, rekenregels als formules.
- wettenbank_wijzigingen: Dit MCP-tool geeft een lijst van wetten die zijn gewijzigd sinds een opgegeven datum. Dat maakt het mogelijk om na elke wetswijziging automatisch te checken welke bestaande annotaties mogelijk verouderd zijn.
- Claude Desktop is de desktopapplicatie van Anthropic — ook die ondersteunt MCP-servers. Gemini CLI is Googles command-line interface voor Gemini-modellen, die eveneens het MCP-protocol ondersteunt.
- Git-versiebeheer van de rapporten maakt diff-analyse mogelijk: bij een wetswijziging zie je exact welke elementen van de annotatie zijn veranderd.
-->

---

<!-- _class: lead -->
<!-- _backgroundColor: #003082 -->

# Vragen & Demo

## Live demo: /jas art25-iw1990

Een artikel annoteren in real-time — van wetstekst naar volledig rapport.

**Belastingdienst — Domein Inning**

<!--
Wat je zegt:
"Dan nu een live demo. Ik annoteer Art. 25 IW 1990 — dat is het artikel over uitstel van betaling — in real-time. Van wetstekst naar volledig rapport. Daarna ruimte voor vragen."

Achtergrond over Art. 25 IW 1990 (demodoelwit):
- Art. 25 IW 1990 regelt het uitstel van betaling. Het artikel is substantieel (meerdere leden), heeft kruisverwijzingen naar de Leidraad Invordering en de Awb, en kent een aantal beleidsmatige invullingen (bijv. uitstel bij bezwaar/beroep).
- Relevante begrippen: "invorderingsambtenaar", "uitstel van betaling", "zekerheid stellen", "renteheffing", "bijzondere omstandigheden".
- Als de demo te lang duurt: je kunt halverwege stoppen bij het genereren van §4 (JAS-annotatie) en de structuur uitleggen. Het volledige rapport kan daarna als bijlage worden gedeeld.

Mogelijke vragen en antwoorden:
- Hoe betrouwbaar is de AI?
  De wetstekst komt rechtstreeks van wetten.overheid.nl — geen hallucinaties over de brondata. De interpretatie is structureel afgedwongen via JAS. Elke claim heeft een bronverwijzing.
- Kan dit ook voor interne beleidsnotities?
  Niet via de MCP (die haalt alleen publieke wetgeving op). Wel via een aangepaste MCP-server die interne documenten ontsluit.
- Is dit al in gebruik?
  Dit is een proof-of-concept gebouwd voor Domein Inning. De workflow is operationeel en getest op meerdere artikelen.
- Wat kost het?
  De MCP-server is open source, de data is CC-0. Kosten zitten alleen in het Claude-gebruik (API of Claude Code licentie).
- Werkt dit ook voor jurisprudentie?
  Niet via deze MCP — die haalt alleen wetgeving op. Uitbreiding naar rechtspraak.nl is technisch mogelijk maar vereist een aparte server.
-->
