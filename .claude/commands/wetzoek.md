---
description: Zoek een juridische term in de kernwetten (IW 1990, UB IW 1990, AWR, Awb) en genereer een gestructureerd wetsanalyse-rapport als MD-bestand.
---

# /wetzoek — Juridische Termanalyse

**Zoekterm:** `$ARGUMENTS`

Voer onderstaande stappen strikt in volgorde uit. Sla alle tussenresultaten op zodat je ze kunt verwerken in het eindrapport.

---

## Stap 1 — Parallelle zoekoproepen via MCP

Roep **gelijktijdig** `wettenbank_ophalen` aan voor alle vier kernwetten met `zoekterm="$ARGUMENTS"`:

| Wet | BWB-id |
|-----|--------|
| Invorderingswet 1990 | `BWBR0004770` |
| Uitvoeringsbesluit Invorderingswet 1990 | `BWBR0004772` |
| AWR | `BWBR0002320` |
| Awb | `BWBR0005537` |

Noteer voor elke wet:
- Hoeveel artikelen de zoekterm bevatten
- Welke artikelnummers gevonden zijn
- De volledige letterlijke tekst van elk gevonden artikel (inclusief lidnummers)

---

## Stap 2 — Kruisreferentie-analyse

Analyseer de in stap 1 gevonden artikelen op verwijzingen naar andere artikelen, zoals:
- "artikel X, [lid] Y" (binnen dezelfde wet)
- "artikel X van de [andere wet]"

Onderscheid:
- **Interne verwijzingen**: verwijzingen binnen dezelfde wet — de tekst hiervan is al beschikbaar uit stap 1
- **Externe verwijzingen**: verwijzingen naar een andere kernwet

Voor elke relevante **externe** verwijzing: haal de volledige tekst op via `wettenbank_ophalen` met de zoekterm gelijk aan het artikel waarnaar verwezen wordt (bijv. `zoekterm="artikel 22"` of gebruik de wetstekst direct uit de reeds opgehaalde wet als die beschikbaar is).

Beperk je tot kruisreferenties die direct inhoudelijk relevant zijn voor het begrip `$ARGUMENTS`.

---

## Stap 3 — Statistieken berekenen

Bereken voor het rapport:
- Totaal aantal artikelen met treffer per wet
- Totaal aantal keer dat de zoekterm voorkomt per wet (tel alle vermeldingen)
- Totaal over alle wetten samen
- Lijst van alle artikelnummers met treffer per wet

---

## Stap 4 — Rapport genereren en opslaan

Genereer het volledige rapport in onderstaand format en sla het op als:

```
analyses/$ARGUMENTS-[TIMESTAMP].md
```

waarbij `[TIMESTAMP]` de huidige datum en tijd is in het formaat `YYYY-MM-DD_HH-MM-SS`. Haal de actuele tijd op met `date +%Y-%m-%d_%H-%M-%S` via Bash.

---

## Rapportformat

```markdown
---
zoekterm: "$ARGUMENTS"
datum: [YYYY-MM-DD_HH-MM-SS]
wetten: IW 1990, UB IW 1990, AWR, Awb
---

# Wetsanalyse: "$ARGUMENTS"

**Datum:** [TIMESTAMP]
**Doorzochte wetten:** Invorderingswet 1990 · Uitvoeringsbesluit IW 1990 · AWR · Awb
**Peildatum wetgeving:** [geldigheidsdatum uit MCP-resultaten]

---

## 1. Statistieken

| Wet | Artikelen met treffer | Geschat aantal vermeldingen | Artikelnummers |
|-----|-----------------------|-----------------------------|----------------|
| IW 1990 | [n] | [n] | art. X, Y, Z |
| UB IW 1990 | [n] | [n] | art. X, Y, Z |
| AWR | [n] | [n] | art. X, Y, Z |
| Awb | [n] | [n] | art. X, Y, Z |
| **Totaal** | **[n]** | **[n]** | |

---

## 2. Vindplaatsen per wet

### 2.1 Invorderingswet 1990 (BWBR0004770)

> *[Naam en omschrijving hoofdstuk/afdeling indien relevant]*

#### Artikel [X]

> [Volledige letterlijke wettekst van het artikel, inclusief alle leden]

**Relevantie:** [1-2 zinnen waarom dit artikel relevant is voor de zoekterm]

---

[herhaal voor elk gevonden artikel in de IW 1990]

---

### 2.2 Uitvoeringsbesluit IW 1990 (BWBR0004772)

[idem]

### 2.3 Algemene wet inzake rijksbelastingen (BWBR0002320)

[idem]

### 2.4 Algemene wet bestuursrecht (BWBR0005537)

[idem]

---

## 3. Kruisreferenties

### 3.1 Interne verwijzingen

| Artikel (bron) | Verwijst naar | Onderwerp |
|----------------|---------------|-----------|
| Art. X IW | Art. Y IW | [onderwerp] |

### 3.2 Externe verwijzingen

| Artikel (bron) | Verwijst naar | Wet | Tekst fragment |
|----------------|---------------|-----|----------------|
| Art. X IW | Art. Y AWR | AWR | [letterlijke tekst van het gerefereerde artikel of lid] |

---

## 4. Juridische samenvatting

### 4.1 Betekenis en gebruik van de term

[2-4 alinea's: wat betekent de term juridisch, hoe wordt hij gebruikt in de wet, wat is de functie]

### 4.2 Samenhang tussen de wetten

[Beschrijf hoe de term samenhangt over de verschillende wetten: is er een hiërarchie? Verwijst de IW 1990 terug naar de AWR of Awb? Hoe verhoudt het UB zich tot de wet?]

### 4.3 Aandachtspunten voor de praktijk

[Benoem spanningen, onduidelijkheden, meerduidigheid of praktische knelpunten die juristen tegenkomen bij deze term]

### 4.4 Relevante jurisprudentie / beleid

[Indien bekend: verwijs naar bekende arresten of beleidsstandpunten. Indien niet zeker: benoem expliciet dat verificatie nodig is en geef geen uitspraken die je niet kunt verifiëren.]

---

## 5. Bronnen

| Wet | BWB-id | Geraadpleegde versie | Bron |
|-----|--------|----------------------|------|
| Invorderingswet 1990 | BWBR0004770 | [datum] | wetten.overheid.nl |
| UB IW 1990 | BWBR0004772 | [datum] | wetten.overheid.nl |
| AWR | BWBR0002320 | [datum] | wetten.overheid.nl |
| Awb | BWBR0005537 | [datum] | wetten.overheid.nl |
```

---

## Kwaliteitseisen

- **Nooit raden**: citeer alleen wat daadwerkelijk in de opgehaalde wetstekst staat.
- **Volledige artikeltekst**: kopieer de letterlijke wettekst, inclusief alle leden. Knip niet af.
- **Onduidelijkheden benoemen**: als de MCP geen resultaten geeft voor een wet, meld dit expliciet in het rapport.
- **Consistentie**: gebruik de grammaticale naam van de zoekterm ook wanneer die in een andere vorm voorkomt (bijv. "termijn" en "termijnen").
- **Sla altijd op**: het eindrapport moet worden opgeslagen als MD-bestand in de `analyses/` map, ook als er weinig resultaten zijn.
