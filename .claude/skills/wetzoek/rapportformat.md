# Wetzoek — Rapportformat en kwaliteitseisen

## Frontmatter (YAML)

```
---
zoekterm: "$ARGUMENTS"
varianten: [[v1], [v2], [v3], …]
datum: [YYYY-MM-DD]
timestamp: [YYYY-MM-DD_HH-MM-SS]
wetten:
  - IW 1990 (BWBR0004770)
  - Leidraad Invordering 2008 (BWBR0024096)
  - UB IW 1990 (BWBR0004772)
  - AWR (BWBR0002320)
  - Awb (BWBR0005537)
---
```

---

## Rapportheader

```
# Wetsanalyse: "$ARGUMENTS"

**Datum:** [DATUM]
**Doorzochte bronnen:** Invorderingswet 1990 · Leidraad Invordering 2008 · Uitvoeringsbesluit IW 1990 · AWR · Awb
**Peildatum wetgeving:** IW 1990: [datum] | Leidraad: [datum] | UB IW 1990: [datum] | AWR: [datum] | Awb: [datum]
**Gezochte varianten:** [v1], [v2], [v3], …
```

---

## §1 Statistieken

| Bron | Artikelen met treffer | Aantal vermeldingen | Artikelnummers (oplopend) |
|------|-----------------------|---------------------|---------------------------|
| IW 1990 | [n] | [n] | art. X, Y, Z |
| Leidraad Invordering | [n] | [n] | art. X, Y, Z |
| UB IW 1990 | [n] | [n] | art. X, Y, Z |
| AWR | [n] | [n] | art. X, Y, Z |
| Awb | [n] | [n] | art. X, Y, Z |
| **Totaal** | **[n]** | **[n]** | |

---

## §2 Vindplaatsen per bron

Volgorde altijd: §2.1 IW 1990 → §2.2 Leidraad → §2.3 UB IW 1990 → §2.4 AWR → §2.5 Awb. Artikelen binnen elke sectie oplopend gesorteerd op artikelnummer.

### §2.1 Invorderingswet 1990 (BWBR0004770)

```
> *[Naam van het hoofdstuk en de afdeling, letterlijk uit de wetstekst]*

#### Artikel [X] (IW 1990)

> [Volledige letterlijke wetstekst, inclusief alle leden en onderdelen]

**Vindplaats zoekterm:** De term "[zoekterm of variant]" komt voor in [lid X / onderdeel Y].
**Rechtsgevolg:** [Één zin: wat is het directe rechtsgevolg van dit artikel voor de betalingsplicht of invorderingsbevoegdheid.]
```

### §2.2 Leidraad Invordering 2008 (BWBR0024096)

Zelfde structuur als §2.1. Bij geen treffer: schrijf exact: "Geen treffer voor varianten [v1, v2, …]. De Leidraad gebruikt voor dit begrip mogelijk een andere term."

### §2.3 Uitvoeringsbesluit IW 1990 (BWBR0004772)

Zelfde structuur als §2.1. Bij geen treffer: zelfde standaardmelding.

### §2.4 Algemene wet inzake rijksbelastingen (BWBR0002320)

Zelfde structuur als §2.1.

### §2.5 Algemene wet bestuursrecht (BWBR0005537)

Zelfde structuur als §2.1, aangevuld met:

**Awb-toepasselijkheid (art. 1 lid 2 IW 1990):**

> [Letterlijk citaat van art. 1 lid 2 IW 1990]

| Awb-titel / afdeling | Gevonden artikel | Van toepassing? |
|----------------------|------------------|-----------------|
| [Titel X.Y] | Art. [X:Y] | Ja / Nee — [reden] |

---

## §3 Kruisreferenties

Alleen expliciete verwijzingen die letterlijk in de artikeltekst staan. Geen aanvullingen op basis van eigen kennis.

### §3.1 Interne verwijzingen

| Artikel (bron) | Verwijst naar | Letterlijke verwijzingstekst |
|----------------|---------------|------------------------------|
| Art. X lid Y [wet] | Art. Z [wet] | "[exacte formulering uit de tekst]" |

Bij geen interne verwijzingen: schrijf exact "Geen interne verwijzingen gevonden in de artikelteksten."

### §3.2 Externe verwijzingen

| Artikel (bron) | Verwijst naar | Wet | Letterlijke verwijzingstekst | Geciteerde doeltekst |
|----------------|---------------|-----|------------------------------|----------------------|
| Art. X [wet] | Art. Y [wet] | [wet] | "[exacte formulering]" | "[letterlijke tekst van het gerefereerde lid]" |

Bij geen externe verwijzingen: schrijf exact "Geen externe verwijzingen gevonden in de artikelteksten."

---

## §4 Juridische samenvatting

### §4.1 Betekenis en gebruik van de term

Beantwoord de volgende drie vragen in deze volgorde, elk als afzonderlijke alinea:

1. **Primaire betekenis in de IW 1990:** Wat regelt de IW 1990 specifiek met betrekking tot de zoekterm? Baseer dit uitsluitend op de in §2 geciteerde wetstekst.
2. **Meerdere betekenissen:** Wordt de term in de gevonden artikelen in meer dan één juridische betekenis gebruikt? Zo ja: benoem elke betekenis en de vindplaats. Zo nee: schrijf "De term wordt in de gevonden artikelen in één betekenis gebruikt."
3. **Verhouding IW 1990 – AWR – Awb:** Hoe verhoudt het gebruik in de IW 1990 zich tot het gebruik in de AWR en de Awb op basis van de gevonden artikelen?

### §4.2 Samenhang tussen de bronnen

Beantwoord de volgende drie vragen in deze volgorde, elk als afzonderlijke alinea:

1. **Lex specialis:** Welke bron bevat de primaire normstelling voor de zoekterm en waarom is die lex specialis ten opzichte van de andere bronnen?
2. **Leidraad als beleidskader:** Hoe vult de Leidraad Invordering de wettelijke bepalingen aan? Verwijs naar het specifieke Leidraad-artikel uit §2. Bij geen treffer: "De Leidraad bevat geen bepalingen met de zoekterm; raadpleeg de Leidraad op aanverwante termen."
3. **Awb-toepasselijkheid:** Welke Awb-titels zijn op grond van art. 1 lid 2 IW 1990 van toepassing en welke zijn uitgesloten? Verwijs naar de tabel in §2.5.

### §4.3 Spanningsvelden

Gebruik uitsluitend de in §2 gevonden wetstekst als grondslag. Bij geen spanningsvelden: schrijf exact "Op basis van de gevonden artikelen zijn geen spanningsvelden geconstateerd."

| Nr | Spanning | Betrokken artikelen | Type |
|----|---------|---------------------|------|
| 1 | [omschrijving] | Art. X [wet] – Art. Y [wet] | Onduidelijk / Meerduidig / Conflicterend |

### §4.4 Aandachtspunten voor de praktijk

Geef **precies 3** genummerde aandachtspunten. Elk aandachtspunt heeft exact de volgende structuur:

**[Nr]. [Titel van het aandachtspunt]**
*Vindplaats:* Art. X, lid Y [wet]
*Gevolg voor de praktijk:* [Één zin over wat de ontvanger of belastingschuldige moet doen of nalaten.]

### §4.5 Relevante jurisprudentie en beleid

Neem uitsluitend op:
- Verwijzingen naar Leidraad-artikelen die in §2 zijn gevonden
- Arresten die algemeen bekend zijn in het invorderingsrecht en direct betrekking hebben op de gevonden artikelen

Gebruik voor elk item exact dit format:

**[Naam / omschrijving]**
*Vindplaats:* [Leidraad art. X / HR [datum] / anders]
*Relevantie:* [Één zin.]
*Status:* Geverifieerd / **Verificatie vereist**

Sluit altijd af met deze vaste zin:
"Voor actuele jurisprudentie wordt raadpleging van rechtspraak.nl en de Leidraad Invordering (actuele versie) aanbevolen."

---

## §5 Bronnen

| Bron | BWB-id | Geraadpleegde versie | Vindplaats |
|------|--------|----------------------|------------|
| Invorderingswet 1990 | BWBR0004770 | [peildatum uit MCP] | wetten.overheid.nl |
| Leidraad Invordering 2008 | BWBR0024096 | [peildatum uit MCP] | wetten.overheid.nl |
| UB IW 1990 | BWBR0004772 | [peildatum uit MCP] | wetten.overheid.nl |
| AWR | BWBR0002320 | [peildatum uit MCP] | wetten.overheid.nl |
| Awb | BWBR0005537 | [peildatum uit MCP] | wetten.overheid.nl |

---

## Kwaliteitseisen (niet-onderhandelbaar)

- **Nooit parafraseren.** Wetstekst altijd letterlijk en volledig citeren.
- **Vijf bronnen altijd doorzoeken.** Ook als de verwachting is dat een bron niets oplevert.
- **Artikelvolgorde altijd oplopend.** Binnen elke bron: numeriek oplopend op artikelnummer.
- **Vermeldingen exact tellen.** Geen schattingen; tel het werkelijke aantal keren dat de zoekterm of variant voorkomt in de opgehaalde tekst.
- **Kruisreferenties alleen uit de tekst.** Geen verwijzingen toevoegen op basis van eigen kennis.
- **Samenvatting via vaste vragen.** Beantwoord de vragen in §4.1 t/m §4.4 in de voorgeschreven volgorde en structuur.
- **Precies 3 aandachtspunten.** Niet meer, niet minder; elk met vindplaats en praktijkgevolg.
- **Jurisprudentie altijd met status.** Elk item heeft "Geverifieerd" of "Verificatie vereist"; nooit ECLI-nummers fabriceren.
- **Standaardzin jurisprudentie altijd sluiten.** De vaste slotalinea is verplicht.
- **Nulresultaten standaardmelding.** Gebruik exact de voorgeschreven tekst bij geen treffer.
- **Peildatum uit MCP.** Gebruik de datum die het MCP-resultaat teruggeeft, niet de datum van vandaag.
- **Altijd opslaan.** Rapport als MD-bestand in `analyses/`.

---

## Pre-save checklist (doorlopen vóór opslaan)

- [ ] Alle vijf bronnen doorzocht (ook bij 0 resultaten)
- [ ] §2: wetstekst letterlijk geciteerd, artikels oplopend genummerd
- [ ] §3: kruisreferenties uit tekst, niet aangenomen
- [ ] §4.4: precies 3 aandachtspunten
- [ ] §4.5: jurisprudentie met status (Geverifieerd / Verificatie vereist); vaste slotalinea aanwezig
- [ ] §5: peildata vanuit MCP ingevuld
- [ ] Bestandsnaam conform: `[zoekterm]-[TIMESTAMP].md`
