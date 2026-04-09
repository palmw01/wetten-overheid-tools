---
description: Voer een volledige JAS-annotatie (v1.0.10) uit op een wetsbepaling en sla het rapport op als MD-bestand. Gebruik: /jas art. 25 IW 1990 of /jas art. 36 lid 4 IW 1990
context: fork
agent: general-purpose
---

# /jas — JAS-annotatie Wetsbepaling

**Artikel:** `$ARGUMENTS`

Voer onderstaande stappen strikt in volgorde uit. Wijk niet af van de voorgeschreven formats.

---

## Stap 0 — Lees bij aanvang

Lees deze twee bestanden volledig vóór enige andere actie:
- `$CLAUDE_SKILL_DIR/kaders.md` — JAS v1.0.10 taxonomie en annotatieprincipes
- `$CLAUDE_SKILL_DIR/rapportformat.md` — §1–§11 structuur, kwaliteitseisen, pre-save checklist

---

## Stap 1 — Bestaande annotatie controleren

Controleer vóór alle overige stappen of er al een annotatie bestaat voor dit artikel:

1. Zoek met `Glob` naar `analyses/jas-annotatie-art[A]-*` (vervang `[A]` met het artikelnummer uit `$ARGUMENTS`).
2. Als een bestaand rapport gevonden wordt:
   - Lees het rapport via de Read tool.
   - Meld aan de gebruiker: "Bestaande annotatie gevonden: [bestandsnaam]. Wetstekst geldig per [peildatum uit frontmatter]. Gebruik je deze als basis of wil je een nieuwe annotatie opstellen?"
   - **Wacht op bevestiging.** Ga alleen verder met de workflow als de gebruiker een nieuwe annotatie vraagt.
3. Als geen bestaand rapport gevonden wordt: ga door met Stap 2.

---

## Stap 2 — Argument parsen

Parseer `$ARGUMENTS` en stel vast:

**Artikelnummer `[A]`**: het nummer na "art." inclusief eventuele letters (9, 25, 36, 2a). Als een specifiek lid is vermeld (bijv. "lid 3"), noteer dit als `[L]`; anders geldt `[L]` = het volledige artikel.

**Wet `[W]` en BWB-id `[B]`**:

| Invoer | [W] | [B] | [BD] begripsbepalings-artikel |
|--------|-----|-----|-------------------------------|
| IW 1990 / Invorderingswet 1990 | Invorderingswet 1990 | BWBR0004770 | 3 |
| AWR | Algemene wet inzake rijksbelastingen | BWBR0002320 | 2 |
| Awb | Algemene wet bestuursrecht | BWBR0005537 | 1:1 |
| UB IW 1990 / Uitvoeringsbesluit IW 1990 | Uitvoeringsbesluit Invorderingswet 1990 | BWBR0004772 | 1 |

Geen herkenbare wet: gebruik IW 1990 (`BWBR0004770`) als standaard en vermeld dit in het rapport.

Noteer: `[A]`, `[W]`, `[B]`, `[L]`, en het begripsbepalings-artikel `[BD]`.

---

## Stap 3 — Wetstekst ophalen en artikelen extraheren

**Parallel aanroepen via MCP:**

Roep tegelijk aan:
- `wettenbank_artikel(bwbId=[B], artikel=[A])` — te annoteren artikel
- `wettenbank_artikel(bwbId=[B], artikel=[BD])` — begripsbepalingen

De tool-resultaten zijn **JSON**. Extraheer per response de volgende velden:
- `citeertitel` — naam van de wet (bijv. `"Invorderingswet 1990"`)
- `versiedatum` — geldigheidspeildatum van de opgehaalde versie (YYYY-MM-DD); noteer als `[PD]`
- `tekst` — de volledige letterlijke wetstekst van het artikel (kopieer woordelijk)
- `leden` — array van objecten `{ lid: string, tekst: string }` per genummerd lid; gebruik dit voor de annotatie per lid (§4); leeg `[]` als het artikel geen genummerde leden heeft
- `structuurpad` — array van structuurniveaus boven het artikel (bijv. `["Hoofdstuk II — Invordering in eerste aanleg", "Afdeling 1 — Betalingstermijnen"]`)
- `bronreferentie` — JCI-uri (bijv. `"jci1.3:c:BWBR0004770&artikel=25"`); gebruik letterlijk in Bijlage B
- `waarschuwing` — `null` of een waarschuwingstekst als het artikel een bijzondere status heeft

**Structuurcontext:** gebruik het `structuurpad`-veld (array van strings) letterlijk voor §1 (structuurpositie in de header) en §2 (Structuurdiagram). **Neem nooit een hoofdstuk- of afdelingstitel aan op basis van de artikelinhoud.** Als `structuurpad` een lege array `[]` is: noteer "Structuurpositie niet beschikbaar" in §2.

Noteer uit `[BD]` alle begripsomschrijvingen die betrekking hebben op termen in artikel `[A]`.

**Gebruik altijd de `artikel`-parameter — nooit de volledige wet ophalen.**

---

## Stap 4 — Art. 1 IW 1990 + Leidraad ophalen (conditioneel)

**Alleen als `[W]` = Invorderingswet 1990 of Uitvoeringsbesluit IW 1990:**

Roep parallel aan:
- `wettenbank_artikel(bwbId="BWBR0004770", artikel="1")` — tenzij `[A]` = 1 (dan al beschikbaar uit Stap 3). Gebruik het `tekst`-veld (JSON) en noteer de letterlijke tekst van art. 1 lid 2 IW 1990 (de Awb-uitsluitingsclausule).
- `wettenbank_artikel(bwbId="BWBR0024096", artikel=[A])` — het Leidraad-artikel met hetzelfde nummer als het te annoteren artikel. Gebruik het `tekst`-veld (JSON). De Leidraad is een beleidsregel (type: beleidsregel), geen wet, maar verplichte bron voor §8 van het rapport. Als het `fout`-veld aanwezig is (artikel niet gevonden): noteer dit en sla §8 over.

**Nooit:** `BWBR0004800` (Leidraad invordering 1990, verlopen per 2005-07-12).

**Als `[W]` ≠ IW 1990 en ≠ UB IW:** sla Stap 4 over.

---

## Stap 5 — Kruisreferenties extraheren

Scan de in Stap 3 verkregen artikeltekst op expliciete verwijzingen. Neem uitsluitend verwijzingen op die **letterlijk in de tekst staan** als "artikel X", "artikel X, lid Y", "artikel X, onderdeel Y". Geen verwijzingen toevoegen op basis van eigen kennis.

Maak twee lijsten:
- **Intern**: verwijzingen naar artikelen binnen dezelfde wet `[W]`
- **Extern**: verwijzingen naar artikelen in andere wetten

Voor **externe** verwijzingen: gebruik `wettenbank_artikel(bwbId=<id>, artikel=<nr>)` per gerefereerd artikel. Roep alle externe artikelen parallel aan. Gebruik het `tekst`-veld (JSON) van elke response.

BWB-ids: IW 1990 = BWBR0004770 | UB IW = BWBR0004772 | AWR = BWBR0002320 | Awb = BWBR0005537 | Leidraad 2008 = BWBR0024096

Vervallen artikelen worden door de MCP gefilterd — gaten in nummering zijn normaal.

---

## Stap 6 — JAS-annotatie uitvoeren

Gebruik de definities, herkenningsvragen en taalkenmerken uit `$CLAUDE_SKILL_DIR/kaders.md`. Voer de annotatie uit op de wetstekst van artikel `[A]` uit Stap 3, aangevuld met de brondefinities uit Stap 3.

**Interne annotatiestap (niet opnemen in rapportoutput):** loop de 13 JAS-elementen af en bepaal per element of het aanwezig is in het artikel: rechtssubject, rechtsobject, rechtsbetrekking, rechtsfeit, voorwaarde, afleidingsregel, variabele/variabelewaarde, parameter/parameterwaarde, operator, tijdsaanduiding, plaatsaanduiding, delegatiebevoegdheid/delegatie-invulling, brondefinitie. Noteer per aanwezig element de vindplaats in het artikel.

**Annotatieprincipes:**
1. Citeer het exacte zinsdeel letterlijk bij elk geclassificeerd element.
2. Kies altijd de meest specifieke JAS-klasse: tijdsaanduiding > variabele; plaatsaanduiding > parameter.
3. Benoem per JAS-element de interpretatiemethode: grammaticaal / systematisch / teleologisch.
4. Markeer meerduidigheid of alternatieve classificaties expliciet in de toelichting.
5. Traceer delegatieketens volledig: wet → amvb → ministeriële regeling; haal alle schakels op.

**Structuur van de annotatietabel:** maak één subsectie per lid van het artikel. Nummer de annotaties doorlopend over alle leden. Gebruik als kolomnamen: Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting.

**Inhoud van de Toelichting-kolom:**
1. Interpretatiemethode (grammaticaal / systematisch / teleologisch)
2. Reden voor keuze van deze JAS-klasse boven alternatieven
3. Meerduidigheid of alternatieve classificatie (indien van toepassing)

---

## Stap 7 — Afleidingsregels en rekenstructuur uitwerken

Op basis van de in Stap 6 geclassificeerde afleidingsregels:

**Beslisregels:** stel per beslisregel de voorwaardenstructuur op (EN/OF/NIET), de uitvoervariabele (ja/nee) en de vindplaats.

**Rekenregels:** stel per rekenregel de formule op met invoervariabelen, uitvoervariabele en vindplaats. Geef een cijfervoorbeeld als de rekenregel niet-triviaal is.

**Parameters:** noteer alle vaste waarden die voor alle rechtssubjecten gelijk zijn (tarieven, termijnen, percentages, drempelbedragen).

---

## Stap 8 — Awb-toepasselijkheidscheck (conditioneel)

**Alleen als `[W]` = IW 1990:** stel per gevonden Awb-artikel (Stap 5, extern) vast of de betreffende Awb-titel van toepassing is op grond van art. 1 lid 2 IW 1990 (Stap 4). Citeer art. 1 lid 2 letterlijk. Vermeld per Awb-titel: van toepassing / uitgesloten / geen expliciete uitzondering met reden.

**Als `[W]` ≠ IW 1990:** sla Stap 8 over.

---

## Stap 9 — Kwaliteitscheck

Doorloop de pre-save checklist in `$CLAUDE_SKILL_DIR/rapportformat.md` volledig vóór opslaan. Alle punten moeten afgevinkt zijn of voorzien van een expliciete toelichting waarom een punt niet van toepassing is.

---

## Stap 10 — Timestamp ophalen en rapport opslaan

Haal de timestamp op via `date +%Y-%m-%d_%H-%M-%S`. Sla het rapport op als:

```
analyses/jas-annotatie-art[A]-[afkorting wet]-[TIMESTAMP].md
```

Voorbeelden:
- `analyses/jas-annotatie-art25-IW1990-2026-04-02_14-30-00.md`
- `analyses/jas-annotatie-art36lid4-IW1990-2026-04-02_14-30-00.md`

Regels voor de bestandsnaam: geen spaties; "art. " → "art"; "lid " → "lid"; IW 1990 → "IW1990"; AWR → "AWR"; Awb → "Awb".

Genereer het rapport conform de structuur in `$CLAUDE_SKILL_DIR/rapportformat.md`. De sectienummers en koppen zijn exact en mogen niet worden gewijzigd.

---

## Stap 11 — Retourneer bestandspad

Retourneer uitsluitend het opgeslagen bestandspad.
