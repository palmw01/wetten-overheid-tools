---
description: Zoek een juridische term in de kernwetten (IW 1990, Leidraad Invordering, UB IW 1990, AWR, Awb) en genereer een gestructureerd wetsanalyse-rapport als MD-bestand.
context: fork
agent: general-purpose
---

# /wetzoek — Juridische Termanalyse

**Zoekterm:** `$ARGUMENTS`

Voer onderstaande stappen strikt in volgorde uit. Wijk niet af van de voorgeschreven formats — consistentie tussen runs is een harde eis.

---

## Stap 0 — Lees bij aanvang

Lees dit bestand volledig vóór enige andere actie:
- `$CLAUDE_SKILL_DIR/rapportformat.md` — §1–§5 structuur, kwaliteitseisen, pre-save checklist

---

## Stap 1 — Morfologische variantenlijst (deterministisch)

Pas de volgende vaste regels toe op `$ARGUMENTS` om de zoekvariantenlijst samen te stellen. De lijst is altijd volledig bepaald door de regels — geen eigen aanvullingen.

**Regel 1 — Enkelvoud/meervoud:**

| Situatie | Actie |
|----------|-------|
| Term eindigt op `-en` en is een zelfstandig naamwoord | Voeg de stam toe (strip `-en`, pas eventuele klinkerverdubbeling of `-s`-omzetting terug) |
| Term eindigt niet op `-en` | Voeg de `-en`-vorm toe; voeg ook de `-s`-vorm toe als gangbaar |
| Term is al een stam | Voeg zowel `-en` als `-s`-meervoud toe indien beide bestaan |

**Regel 2 — Samenstellingen:** voeg uitsluitend toe als de samenstelling een zelfstandige juridische term is die als zodanig in wetgeving voorkomt. Gebruik de tabel:

| Stam | Vaste toevoeging |
|------|-----------------|
| termijn | termijnen, betalingstermijn, betalingstermijnen |
| beslag | beslagen, beslaglegging |
| uitstel | uitstel van betaling |
| aansprakelijk | aansprakelijkheid, aansprakelijkheden |
| dwangbevel | dwangbevelen |
| kwijtscheld | kwijtschelding, kwijtschelding van belasting |
| verjaring | verjaringstermijn, verjaringstermijnen |
| verrekening | verrekenen |

**Regel 3 — Maximaal:** de variantenlijst bevat maximaal 4 termen. Kies de meest voorkomende als er meer dan 4 zouden ontstaan.

Noteer de definitieve variantenlijst als: `[v1, v2, v3, ...]` en gebruik deze exact in alle volgende stappen.

---

## Stap 2 — Parallelle zoekoproepen via MCP

Roep **gelijktijdig** `wettenbank_ophalen` aan voor alle vijf bronnen met de primaire zoekterm `$ARGUMENTS`. Herhaal direct daarna voor elke variant die de primaire zoekterm niet al dekt. Combineer alle unieke artikelen per bron.

| Bron | BWB-id |
|------|--------|
| Invorderingswet 1990 | `BWBR0004770` |
| Leidraad Invordering 2008 | `BWBR0024096` |
| Uitvoeringsbesluit Invorderingswet 1990 | `BWBR0004772` |
| AWR | `BWBR0002320` |
| Awb | `BWBR0005537` |

**Nooit:** `BWBR0004800` (Leidraad invordering 1990, verlopen per 2005-07-12).

Gebruik altijd `zoekterm`-parameter, nooit de volledige wet ophalen zonder parameter. Bij 0 resultaten op de primaire term: direct herhalen met de andere woordvorm uit de variantenlijst. Altijd alle vijf bronnen doorzoeken — ook bij 0 resultaten.

Noteer per bron:
- Geldigheidsdatum van de geraadpleegde versie (uit het MCP-resultaat — gebruik exact deze datum)
- Alle gevonden artikelnummers (nog niet sorteren)
- Volledige letterlijke tekst van elk gevonden artikel, inclusief alle leden en onderdelen

Bij 0 resultaten op alle varianten: noteer "geen treffer" voor die bron en ga door.

---

## Stap 3 — Awb-toepasselijkheidscheck

Haal op: `wettenbank_ophalen(bwbId="BWBR0004770", artikel="1")` — tenzij art. 1 IW 1990 al beschikbaar is uit Stap 2.

Stel vast welke Awb-titels zijn uitgesloten via art. 1 lid 2 IW 1990. Citeer art. 1 lid 2 letterlijk. Vermeld per gevonden Awb-artikel of de betreffende titel van toepassing is of uitgesloten.

---

## Stap 4 — Kruisreferentie-inventarisatie

Scan de in Stap 2 verkregen artikelteksten op expliciete verwijzingen. Neem uitsluitend verwijzingen op die **letterlijk in de tekst staan** als "artikel X" of "artikel X, lid Y" of "artikel X, onderdeel Y". Voeg geen verwijzingen toe op basis van eigen kennis.

Categoriseer elke gevonden verwijzing:
- **Intern**: verwijzing naar een artikel binnen dezelfde bron — tekst al beschikbaar uit Stap 2
- **Extern**: verwijzing naar een andere bron — haal de betreffende artikeltekst op via `wettenbank_ophalen`

---

## Stap 5 — Statistieken berekenen

Tel per bron:
- **Aantal artikelen met treffer**: het aantal unieke artikelnummers uit Stap 2
- **Aantal vermeldingen**: tel hoe vaak de zoekterm of een variant letterlijk voorkomt in alle gevonden artikelteksten samen per bron (exact tellen, geen schatting)
- **Artikelnummers**: sorteer oplopend, numeriek (1, 2, 3…; bij letters na het nummer: 1, 2, 2a, 2b, 3…)

---

## Stap 6 — Kwaliteitscheck

Doorloop de pre-save checklist in `$CLAUDE_SKILL_DIR/rapportformat.md` volledig vóór opslaan. Alle punten moeten afgevinkt zijn.

---

## Stap 7 — Rapport genereren en opslaan

Haal de timestamp op via `date +%Y-%m-%d_%H-%M-%S`. Sla het rapport op als:

```
analyses/$ARGUMENTS-[TIMESTAMP].md
```

Genereer het rapport strikt conform het format in `$CLAUDE_SKILL_DIR/rapportformat.md`. Elk veld is verplicht. Gebruik exact de voorgeschreven koppen en tabelstructuren.

---

## Stap 8 — Retourneer bestandspad

Retourneer uitsluitend het opgeslagen bestandspad.
