---
description: Zoek een juridische term in de kernwetten (IW 1990, Leidraad Invordering, UB IW 1990, AWR, Awb) en genereer een gestructureerd wetsanalyse-rapport als MD-bestand.
---

# /wetzoek — Juridische Termanalyse

**Zoekterm:** `$ARGUMENTS`

Voer onderstaande stappen strikt in volgorde uit.

---

## Stap 1 — Morfologische variantenlijst bepalen

Bepaal vóór het zoeken alle grammaticale vormen van de zoekterm `$ARGUMENTS`. Stel minimaal de volgende varianten vast:

- Enkelvoud én meervoud
- Werkwoordsvorm indien van toepassing (bijv. "beslag" → "beslagleggen", "beslaglegging")
- Samenstellingen die in de invorderingspraktijk gangbaar zijn

Voorbeelden:

| Opgegeven term | Zoek ook op |
|---------------|-------------|
| termijnen | termijn |
| termijn | termijnen |
| uitstel | uitstellen, uitstel van betaling |
| aansprakelijkheid | aansprakelijk, aansprakelijkheden |
| dwangbevel | dwangbevelen |
| beslag | beslagen, beslaglegging, beslagrecht |
| kwijtschelding | kwijtschelden |
| verrekening | verrekenen |

Noteer de volledige variantenlijst voordat je gaat zoeken.

---

## Stap 2 — Parallelle zoekoproepen via MCP

Roep **gelijktijdig** `wettenbank_ophalen` aan voor alle vijf kernbronnen. Gebruik de primaire zoekterm `$ARGUMENTS` als `zoekterm`. Zoek **tegelijkertijd** ook op de morfologische varianten uit Stap 1 — combineer de resultaten per wet.

| Bron | BWB-id |
|------|--------|
| Invorderingswet 1990 | `BWBR0004770` |
| Leidraad Invordering 2008 | `BWBR0004800` |
| Uitvoeringsbesluit Invorderingswet 1990 | `BWBR0004772` |
| AWR | `BWBR0002320` |
| Awb | `BWBR0005537` |

Als een bron 0 resultaten geeft op alle varianten, meld dit expliciet in het rapport met een verklaring (bijv. andere woordkeuze, uitdrukking via "datum" i.p.v. "termijn").

Noteer per bron:
- Geldigheidsdatum van de geraadpleegde versie (staat in het MCP-resultaat)
- Alle artikelnummers / paragraafnummers met treffer
- De **volledige letterlijke tekst** van elk gevonden artikel/paragraaf, inclusief alle leden en onderdelen

---

## Stap 3 — Awb-toepasselijkheidscheck

Wanneer in Stap 2 relevante Awb-bepalingen zijn gevonden: controleer altijd of de betreffende Awb-titel of afdeling van toepassing is op de invorderingspraktijk. Raadpleeg daarvoor **art. 1 lid 2 IW 1990**, dat bepaalde Awb-titels uitdrukkelijk uitsluit.

Vermeld in §3.2 van het rapport welke Awb-bepalingen van toepassing zijn en welke zijn uitgesloten op grond van art. 1 lid 2 IW 1990.

---

## Stap 4 — Kruisreferentie-analyse

Analyseer de gevonden artikelen op verwijzingen naar andere artikelen:

**Interne verwijzingen** (binnen dezelfde wet): de tekst is al beschikbaar uit Stap 2.

**Externe verwijzingen** (naar een andere wet of bron): haal de volledige tekst op via `wettenbank_ophalen` voor zover deze inhoudelijk relevant zijn voor `$ARGUMENTS`. Beperk je tot verwijzingen die direct relevant zijn.

---

## Stap 5 — Statistieken berekenen

Bereken op basis van de letterlijke wetstekst uit Stap 2:
- Aantal artikelen/paragrafen met treffer per bron
- Aantal keer dat de zoekterm (en varianten) voorkomt per bron
- Totaal over alle bronnen
- Lijst van artikelnummers per bron

---

## Stap 6 — Rapport genereren en opslaan

Genereer het volledige rapport conform het onderstaande format. Sla op als:

```
analyses/$ARGUMENTS-[TIMESTAMP].md
```

waarbij `[TIMESTAMP]` de huidige datum en tijd is in het formaat `YYYY-MM-DD_HH-MM-SS`. Haal de actuele tijd op met `date +%Y-%m-%d_%H-%M-%S` via Bash.

---

## Rapportformat

```markdown
---
zoekterm: "$ARGUMENTS"
datum: [YYYY-MM-DD]
timestamp: [YYYY-MM-DD_HH-MM-SS]
wetten:
  - IW 1990 (BWBR0004770)
  - Leidraad Invordering 2008 (BWBR0004800)
  - UB IW 1990 (BWBR0004772)
  - AWR (BWBR0002320)
  - Awb (BWBR0005537)
---

# Wetsanalyse: "$ARGUMENTS"

**Datum:** [DATUM]
**Doorzochte bronnen:** Invorderingswet 1990 · Leidraad Invordering 2008 · Uitvoeringsbesluit IW 1990 · AWR · Awb
**Peildatum wetgeving:** IW 1990: [datum] | Leidraad: [datum] | UB IW 1990: [datum] | AWR: [datum] | Awb: [datum]
**Gezochte varianten:** [zoekterm], [variant1], [variant2], …

---

## 1. Statistieken

| Bron | Artikelen met treffer | Geschat aantal vermeldingen | Artikelnummers |
|------|-----------------------|-----------------------------|----------------|
| IW 1990 | [n] | [n] | art. X, Y, Z |
| Leidraad Invordering | [n] | [n] | art. X, Y, Z |
| UB IW 1990 | [n] | [n] | art. X, Y, Z |
| AWR | [n] | [n] | art. X, Y, Z |
| Awb | [n] | [n] | art. X, Y, Z |
| **Totaal** | **[n]** | **[n]** | |

---

## 2. Vindplaatsen per bron

### 2.1 Invorderingswet 1990 (BWBR0004770)

> *[Naam van het hoofdstuk/de afdeling]*

#### Artikel [X] (IW 1990)

> [Volledige letterlijke wetstekst van het artikel, inclusief alle leden en onderdelen]

**Relevantie:** [1-2 zinnen: waarom is dit artikel relevant voor de zoekterm, wat regelt het concreet]

---

[Herhaal voor elk gevonden artikel]

### 2.2 Leidraad Invordering 2008 (BWBR0004800)

> *[Onderdeel / paragraaf van de Leidraad]*

#### Artikel [X] Leidraad

> [Volledige letterlijke tekst]

**Relevantie:** [1-2 zinnen]

---

[Herhaal; als geen resultaat: meld expliciet welke varianten zijn gezocht en dat er geen treffer was]

### 2.3 Uitvoeringsbesluit IW 1990 (BWBR0004772)

[idem]

### 2.4 Algemene wet inzake rijksbelastingen (BWBR0002320)

[idem]

### 2.5 Algemene wet bestuursrecht (BWBR0005537)

[idem; vermeld ook de uitkomst van de Awb-toepasselijkheidscheck uit Stap 3]

---

## 3. Kruisreferenties

### 3.1 Interne verwijzingen

| Artikel (bron) | Verwijst naar | Onderwerp |
|----------------|---------------|-----------|
| Art. X lid Y IW | Art. Z IW | [onderwerp van de verwijzing] |

### 3.2 Externe verwijzingen en Awb-toepasselijkheid

| Artikel (bron) | Verwijst naar | Wet | Geciteerde tekst |
|----------------|---------------|-----|-----------------|
| Art. X IW | Art. Y AWR | AWR | "[letterlijke tekst van het gerefereerde lid]" |

*Awb-toepasselijkheid: [welke Awb-titels zijn van toepassing op grond van art. 1 lid 2 IW 1990, welke zijn uitgesloten]*

---

## 4. Juridische samenvatting

### 4.1 Betekenis en gebruik van de term

[2-4 alinea's: juridische betekenis, hoe de term wordt gebruikt in wet en Leidraad, onderscheid in betekenissen indien van toepassing. Altijd gebaseerd op de letterlijk geciteerde tekst uit §2.]

### 4.2 Samenhang tussen de bronnen

[Beschrijf de hiërarchie: wet (IW 1990) → uitvoeringsbesluit (UB IW) → beleid (Leidraad). Hoe verhoudt de AWR zich als aanvullend kader? Welke Awb-titels zijn onverkort van toepassing? Welke wet is lex specialis?]

### 4.3 Spanningsvelden

[Benoem expliciet: conflicten tussen bepalingen, spanning met algemene beginselen (rechtszekerheid, evenredigheid, vertrouwensbeginsel), onduidelijkheden of meerduidigheid. Indien geen spanningsvelden: meld dit expliciet.]

### 4.4 Aandachtspunten voor de praktijk

[Geef 2-5 genummerde aandachtspunten die direct relevant zijn voor de invorderingspraktijk bij de Belastingdienst. Houd rekening met de positie van de ontvanger, de belastingschuldige en eventuele aansprakelijkgestelden. Betrek de Leidraad Invordering als beleidskader.]

### 4.5 Relevante jurisprudentie en beleid

[Indien bekend: verwijs naar bekende arresten of beleidsstandpunten. Markeer met *"Verificatie vereist"* als je niet zeker bent van de vindplaats. Verzin geen arresten of ECLI-nummers. Verwijs bij beleid altijd naar het specifieke artikel van de Leidraad Invordering.]

---

## 5. Bronnen

| Bron | BWB-id | Geraadpleegde versie | Vindplaats |
|------|--------|----------------------|------------|
| Invorderingswet 1990 | BWBR0004770 | [datum] | wetten.overheid.nl |
| Leidraad Invordering 2008 | BWBR0004800 | [datum] | wetten.overheid.nl |
| UB IW 1990 | BWBR0004772 | [datum] | wetten.overheid.nl |
| AWR | BWBR0002320 | [datum] | wetten.overheid.nl |
| Awb | BWBR0005537 | [datum] | wetten.overheid.nl |
```

---

## Kwaliteitseisen (niet-onderhandelbaar)

- **Nooit parafraseren.** Citeer wetstekst en Leidraad altijd letterlijk en volledig, inclusief alle leden en onderdelen. Eigen samenvatting van een artikel is verboden.
- **Vijf bronnen doorzoeken.** Altijd IW 1990, Leidraad Invordering, UB IW 1990, AWR én Awb — ook als de verwachting is dat een bron niets oplevert.
- **Morfologische volledigheid.** Zoek parallel op alle varianten (enkelvoud, meervoud, samenstellingen). Vermeld alle gebruikte varianten in de rapport-header.
- **Peildatum altijd vermelden.** Geldigheidsdatum per bron opnemen in de header.
- **Awb-toepasselijkheidscheck.** Controleer altijd art. 1 lid 2 IW 1990 bij relevante Awb-bevindingen.
- **Nulresultaten expliciet melden.** Schrijf bij elke bron zonder treffer welke varianten zijn geprobeerd en wat de mogelijke verklaring is.
- **Nooit arresten verzinnen.** Bij twijfel over vindplaats: "Verificatie vereist". Geen ECLI-nummers fabriceren.
- **Altijd opslaan.** Rapport als MD-bestand in `analyses/`, ook bij weinig resultaten.
