---
description: Voer een volledige JAS-annotatie (v1.0.7) uit op een wetsbepaling en sla het rapport op als MD-bestand. Gebruik: /jas art. 25 IW 1990 of /jas art. 36 lid 4 IW 1990
---

# /jas — JAS-annotatie Wetsbepaling

**Artikel:** `$ARGUMENTS`

Voer onderstaande stappen strikt in volgorde uit. Wijk niet af van de voorgeschreven formats.

---

## Stap 0 — Bestaande annotatie controleren

Controleer vóór alle overige stappen of er al een annotatie bestaat voor dit artikel:

1. Zoek met `Glob` naar `analyses/jas-annotatie-art[A]-*` (vervang `[A]` met het artikelnummer uit `$ARGUMENTS`).
2. Als een bestaand rapport gevonden wordt:
   - Lees het rapport via de Read tool.
   - Meld aan de gebruiker: "Bestaande annotatie gevonden: [bestandsnaam]. Wetstekst geldig per [peildatum uit frontmatter]. Gebruik je deze als basis of wil je een nieuwe annotatie opstellen?"
   - **Wacht op bevestiging.** Ga alleen verder met de workflow als de gebruiker een nieuwe annotatie vraagt.
3. Als geen bestaand rapport gevonden wordt: ga door met Stap 1.

---

## Stap 1 — Argument parsen

Parseer `$ARGUMENTS` en stel vast:

**Artikelnummer `[A]`**: het nummer na "art." inclusief eventuele letters (9, 25, 36, 2a). Als een specifiek lid is vermeld (bijv. "lid 3"), noteer dit als `[L]`; anders geldt `[L]` = het volledige artikel.

**Wet `[W]` en BWB-id `[B]`**: gebruik de volgende tabel:

| Afkorting in argument | Wet `[W]` | BWB-id `[B]` | Begripsbepalingen |
|-----------------------|-----------|--------------|-------------------|
| IW 1990 / IW / Invorderingswet | Invorderingswet 1990 | `BWBR0004770` | Art. 2 |
| Leidraad / LI | Leidraad Invordering 2008 | `BWBR0024096` | Art. 1 |
| UB IW / UBIB | Uitvoeringsbesluit IW 1990 | `BWBR0004772` | Art. 1 |
| AWR | Algemene wet inzake rijksbelastingen | `BWBR0002320` | Art. 1 |
| Awb | Algemene wet bestuursrecht | `BWBR0005537` | Per hoofdstuk |

Geen herkenbare wet: gebruik IW 1990 (BWBR0004770) als standaard en vermeld dit in het rapport.

Noteer: `[A]`, `[W]`, `[B]`, `[L]`, en het begripsbepalings-artikel `[BD]`.

---

## Stap 2 — Wetstekst ophalen en artikelen extraheren

**2a. Artikel [A] direct ophalen via MCP:**

Roep aan: `wettenbank_ophalen(bwbId=[B], artikel=[A])`

De `artikel`-parameter geeft uitsluitend het gevraagde artikel terug en werkt ook voor grote wetten (Awb, IW 1990 voorbij 50KB-grens). De wetstekst staat direct in het tool-resultaat. Noteer de peildatum `[PD]`, de geldigheidsdatum en de volledige letterlijke wetstekst inclusief het hoofdstuk/de afdeling.

**2b. Volledige wet ophalen voor begripsbepalingen en art. 1:**

Roep eenmalig aan: `wettenbank_ophalen(bwbId=[B])` (zonder `artikel`). Noteer het bestandspad `[JSON_IW]` uit de tool-result melding. Dit bestand is nodig voor Stap 2c en Stap 3. Geen nieuwe MCP-call nodig als `[JSON_IW]` al beschikbaar is.

**2c. Begripsbepalingen extraheren via Bash (uit `[JSON_IW]`):**

```bash
python3 -c "
import json, re
def extraheer_artikel(jsonfile, artikel):
    with open(jsonfile) as f:
        text = json.load(f)[0]['text']
    parts = re.split(r'(?=Artikel \d)', text)
    result = next((p for p in parts if re.match(rf'Artikel {re.escape(str(artikel))}[ \t]', p)), None)
    if not result:
        return f'Artikel {artikel} niet gevonden'
    clean = re.sub(r'\s*\d{4}\s+\d+\s+\d{2}-\d{2}-\d{4}.*', '', result, flags=re.DOTALL)
    return clean.strip()
print(extraheer_artikel('[JSON_IW]', '[BD]'))
"
```

Noteer alle begripsomschrijvingen die betrekking hebben op termen in artikel `[A]`.

---

## Stap 3 — Art. 1 IW 1990 extraheren voor Awb-check (conditioneel)

**Alleen als `[W]` = Invorderingswet 1990 of Uitvoeringsbesluit IW 1990:**

Art. 1 IW 1990 zit in hetzelfde JSON-bestand `[JSON_IW]` — geen nieuwe MCP-call nodig. Tenzij art. 1 al het te annoteren artikel is (dan is de tekst al beschikbaar uit Stap 2b):

```bash
python3 -c "
import json, re
def extraheer_artikel(jsonfile, artikel):
    with open(jsonfile) as f:
        text = json.load(f)[0]['text']
    parts = re.split(r'(?=Artikel \d)', text)
    result = next((p for p in parts if re.match(rf'Artikel {re.escape(str(artikel))}[ \t]', p)), None)
    if not result:
        return f'Artikel {artikel} niet gevonden'
    clean = re.sub(r'\s*\d{4}\s+\d+\s+\d{2}-\d{2}-\d{4}.*', '', result, flags=re.DOTALL)
    return clean.strip()
print(extraheer_artikel('[JSON_IW]', '1'))
"
```

Noteer de letterlijke tekst van art. 1 lid 2 IW 1990 (de Awb-uitsluitingsclausule).

**Leidraad Invordering 2008 ophalen via MCP (verplicht bij IW 1990 en UB IW)**

Roep aan: `wettenbank_ophalen(bwbId="BWBR0024096", artikel=[A])` — het Leidraad-artikel met hetzelfde nummer als het te annoteren artikel staat direct in het tool-resultaat. De Leidraad is een beleidsregel (type: beleidsregel), geen wet, maar verplichte bron voor §8 van het rapport. Bij 0 resultaat (geen overeenkomstig Leidraad-artikel): noteer dit en sla §8 over.

**Als `[W]` ≠ IW 1990 en ≠ UB IW:** sla Stap 3 over.

---

## Stap 4 — Kruisreferenties extraheren

Scan de in Stap 2b verkregen artikeltekst op expliciete verwijzingen. Neem uitsluitend verwijzingen op die **letterlijk in de tekst staan** als "artikel X", "artikel X, lid Y", "artikel X, onderdeel Y". Geen verwijzingen toevoegen op basis van eigen kennis.

Maak twee lijsten:
- **Intern**: verwijzingen naar artikelen binnen dezelfde wet `[W]` — extraheer via Bash uit `[JSON_IW]`
- **Extern**: verwijzingen naar artikelen in andere wetten

Voor **externe** verwijzingen: gebruik `wettenbank_ophalen(bwbId=<id>, artikel=<nr>)` per gerefereerd artikel. Dit werkt ook voor Awb-artikelen in hfst. 4-10 die onbereikbaar zijn bij volledige opvraging. Roep alle externe artikelen parallel aan.

---

## Stap 5 — JAS-annotatie uitvoeren

Gebruik de definities, herkenningsvragen en taalkenmerken uit `jas-kaders.md`. Voer de annotatie uit op de wetstekst van artikel `[A]` uit Stap 2a, aangevuld met de brondefinities uit Stap 2b.

**Interne annotatiestap (niet opnemen in rapportoutput):** loop de 13 JAS-elementen af en bepaal per element of het aanwezig is in het artikel: rechtssubject, rechtsobject, rechtsbetrekking, rechtsfeit, voorwaarde, afleidingsregel, variabele/variabelewaarde, parameter/parameterwaarde, operator, tijdsaanduiding, plaatsaanduiding, delegatiebevoegdheid/delegatie-invulling, brondefinitie. Noteer per aanwezig element de vindplaats in het artikel.

**Annotatieprincipes:**
1. Citeer het exacte zinsdeel letterlijk bij elk geclassificeerd element.
2. Kies altijd de meest specifieke JAS-klasse: tijdsaanduiding > variabele; plaatsaanduiding > parameter.
3. Benoem per JAS-element de interpretatiemethode: grammaticaal / systematisch / teleologisch.
4. Markeer meerduidigheid of alternatieve classificaties expliciet in de toelichting.
5. Traceer delegatieketens volledig: wet → amvb → ministeriële regeling.

**Structuur van de annotatietabel:** maak één subsectie per lid van het artikel. Nummer de annotaties doorlopend over alle leden. Gebruik als kolomnamen: Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting.

**Inhoud van de Toelichting-kolom:**
1. Interpretatiemethode (grammaticaal / systematisch / teleologisch)
2. Reden voor keuze van deze JAS-klasse boven alternatieven
3. Meerduidigheid of alternatieve classificatie (indien van toepassing)

---

## Stap 6 — Afleidingsregels en rekenstructuur uitwerken

Op basis van de in Stap 5 geclassificeerde afleidingsregels:

**Beslisregels:** stel per beslisregel de voorwaardenstructuur op (EN/OF/NIET), de uitvoervariabele (ja/nee) en de vindplaats.

**Rekenregels:** stel per rekenregel de formule op met invoervariabelen, uitvoervariabele en vindplaats. Geef een cijfervoorbeeld als de rekenregel niet-triviaal is.

**Parameters:** noteer alle vaste waarden die voor alle rechtssubjecten gelijk zijn (tarieven, termijnen, percentages, drempelbedragen).

---

## Stap 7 — Awb-toepasselijkheidscheck (conditioneel)

**Alleen als `[W]` = IW 1990:** stel per gevonden Awb-artikel (Stap 4, extern) vast of de betreffende Awb-titel van toepassing is op grond van art. 1 lid 2 IW 1990 (Stap 3b). Citeer art. 1 lid 2 letterlijk. Vermeld per Awb-titel: van toepassing / uitgesloten / geen expliciete uitzondering met reden.

**Als `[W]` ≠ IW 1990:** sla Stap 7 over.

---

## Stap 8 — Timestamp ophalen en rapport opslaan

Haal de timestamp op via `date +%Y-%m-%d_%H-%M-%S`. Sla het rapport op als:

```
analyses/jas-annotatie-art[A]-[afkorting wet]-[TIMESTAMP].md
```

Voorbeelden:
- `analyses/jas-annotatie-art25-IW1990-2026-04-02_14-30-00.md`
- `analyses/jas-annotatie-art36lid4-IW1990-2026-04-02_14-30-00.md`

Regels voor de bestandsnaam: geen spaties; "art. " → "art"; "lid " → "lid"; IW 1990 → "IW1990"; AWR → "AWR"; Awb → "Awb".

---

## Rapportformat (elk veld verplicht, volgorde onwijzigbaar)

Genereer het rapport conform de onderstaande structuur. De sectienummers en koppen zijn exact en mogen niet worden gewijzigd.

---

### Frontmatter (YAML)

```
---
type: jas-annotatie
artikel: [volledige artikelreferentie, bijv. Art. 25 IW 1990]
wet: [volledige wetnaam (BWB-id)]
datum: [YYYY-MM-DD]
timestamp: [YYYY-MM-DD_HH-MM-SS]
peildatum: [peildatum [PD] uit MCP]
analist: Belastingdienst — Domein Inning
jas-versie: 1.0.7
---
```

---

### Rapportheader

```
# JAS-annotatie: [Volledige artikelreferentie]
## [Naam van het hoofdstuk / de afdeling, letterlijk uit de wetstekst]

**Analysedatum:** [DATUM]
**Peildatum wetstekst:** [PD] ([wet], geldig t/m [vervaldatum uit MCP])
**Analist:** Belastingdienst — Domein Inning
**JAS-versie:** 1.0.7
```

---

### §1 Wetstekst (letterlijk, geldig per [PD])

Citeer de volledige, letterlijke tekst van artikel `[A]`. Elk lid op een nieuwe regel met vetgedrukt lidnummer. Geen parafrase, geen samenvatting.

Voorbeeld-opmaak:
```
**Artikel [A] [wetnaam] — [artikeltitel indien aanwezig]**

> **1** [letterlijke tekst lid 1]
>
> **2** [letterlijke tekst lid 2]
```

---

### §2 Structuurdiagram

Breng de interne relaties tussen de leden in kaart: welk lid is de hoofdregel, welke leden zijn afwijkingen, uitzonderingen of nadere invullingen. Gebruik de volgende vaste notatie:

```
Art. [A] lid 1 — [omschrijving hoofdregel]
  ├── lid 2 — [afwijking / uitzondering]
  │     └── lid N — [afwijking op lid 2]
  ├── lid 3 — [omschrijving]
  └── lid M — [vangnet / slotbepaling]
```

Bij een enkel lid zonder interne structuur: schrijf "Artikel [A] heeft één lid; geen interne structuurverhouding."

---

### §3 Brondefinities

Citeer alle begripsomschrijvingen (uit Stap 2b) die betrekking hebben op termen in artikel `[A]`. Elke definitie letterlijk geciteerd.

| Term | Definitie (letterlijk geciteerd) | Vindplaats | Reikwijdte |
|------|----------------------------------|------------|------------|
| [term] | "[letterlijk citaat]" | Art. [BD] lid Y sub z [wet] | [bijv. "Gehele IW 1990"] |

Bij geen relevante brondefinities: schrijf exact "Geen brondefinities van toepassing voor de termen in artikel [A]."

---

### §4 JAS-annotatie per lid

Schrijf boven de tabel exact deze leeswijzer:

> **Leeswijzer toelichting-kolom:** Vermeldt (1) toegepaste interpretatiemethode, (2) reden voor JAS-klasse boven alternatieven, (3) meerduidigheid of alternatieve classificatie.

Maak per lid een subsectie. Nummer annotaties doorlopend over alle leden.

```
### 4.1 Lid 1 — [korte omschrijving van dit lid]

| Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting |
|----|-----------------------------------|-------------|-------------|
| 1 | "[citaat]" | **[JAS-klasse]** | [interpretatiemethode + motivering] |
| 2 | "[citaat]" | **[JAS-klasse]** | [interpretatiemethode + motivering] |

### 4.2 Lid 2 — [korte omschrijving]

| Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting |
|----|-----------------------------------|-------------|-------------|
| [doorlopend nummer] | "[citaat]" | **[JAS-klasse]** | [toelichting] |
```

Na het laatste lid: voeg toe:

```
### 4.[N+1] Delegatiestructuur

| Delegatiebevoegdheid | Vindplaats | Type | Delegatie-invulling | Vindplaats invulling |
|---------------------|------------|------|---------------------|---------------------|
| [omschrijving] | Art. [A] lid Y | Verplicht / Facultatief | [naam regeling] | Art. Z [regeling] |
```

Bij geen delegatie: schrijf exact "Geen delegatiebevoegdheden in artikel [A]."

---

### §5 Afleidingsregels en rekenstructuur

**§5.1 Beslisregels**

| Beslisregel | Voorwaarden (EN/OF/NIET) | Uitkomst (ja/nee) | Vindplaats |
|-------------|--------------------------|-------------------|------------|
| [naam] | [conditiestructuur] | [uitkomst] | Art. [A] lid Y |

Bij geen beslisregels: schrijf exact "Geen beslisregels in artikel [A]."

**§5.2 Rekenregels**

| Rekenregel | Formule | Invoervariabelen | Uitvoervariabele | Voorbeeld | Vindplaats |
|-----------|---------|-----------------|-----------------|-----------|------------|
| [naam] | [formule] | [variabelen] | [uitkomst] | [cijfervoorbeeld] | Art. [A] lid Y |

Bij geen rekenregels: schrijf exact "Geen rekenregels in artikel [A]."

**§5.3 Parameters (vaste waarden)**

| Parameter | Waarde | Geldig per | Vindplaats |
|-----------|--------|-----------|------------|
| [naam] | [waarde] | [datum of periode] | Art. [A] lid Y |

Bij geen parameters: schrijf exact "Geen parameters in artikel [A]."

---

### §6 Termijnen en tijdsaanduidingen

| Termijn / Tijdstip | Duur / Datum | Aanvang | Einde | Rechtsgevolg | Vindplaats |
|-------------------|-------------|---------|-------|-------------|------------|
| [naam] | [duur] | [aanvang] | [einde] | [rechtsgevolg] | Art. [A] lid Y |

Bij geen termijnen: schrijf exact "Geen termijnen in artikel [A]."

---

### §7 Kruisreferenties

**§7.1 Interne verwijzingen (binnen [wetnaam])**

| Artikel (bron) | Verwijst naar | Letterlijke verwijzingstekst | Relevantie voor annotatie |
|----------------|---------------|------------------------------|--------------------------|
| Art. [A] lid Y [wet] | Art. Z lid W [wet] | "[exacte formulering uit tekst]" | [één zin] |

Bij geen interne verwijzingen: schrijf exact "Geen interne verwijzingen in de tekst van artikel [A]."

**§7.2 Externe verwijzingen (naar andere wetten)**

| Artikel (bron) | Verwijst naar | Wet | Letterlijke verwijzingstekst | Geciteerde doeltekst |
|----------------|---------------|-----|------------------------------|----------------------|
| Art. [A] lid Y [wet] | Art. Z lid W | [wetnaam] | "[exacte formulering]" | "[letterlijke tekst gerefereerd lid]" |

Bij geen externe verwijzingen: schrijf exact "Geen externe verwijzingen in de tekst van artikel [A]."

**§7.3 Awb-toepasselijkheid** *(alleen opnemen als `[W]` = IW 1990)*

Citeer art. 1 lid 2 IW 1990 letterlijk als blokcitaat. Vul daarna de tabel in:

| Awb-titel / afdeling | Gevonden artikel | Van toepassing? | Reden |
|----------------------|------------------|-----------------|-------|
| [Awb-titel X.Y] | Art. X:Y Awb | Ja / Nee / Geen expliciete uitzondering | [reden op basis van art. 1 lid 2] |

Bij geen Awb-verwijzingen in artikel [A]: schrijf exact "Artikel [A] bevat geen verwijzingen naar de Awb; Awb-toepasselijkheidscheck niet van toepassing."

---

### §8 Beleidskader: Leidraad Invordering *(alleen opnemen als `[W]` = IW 1990 of UB IW)*

Citeer de gevonden Leidraad-bepalingen letterlijk als blokcitaat.

**Leidraad Invordering 2008 — [vindplaats]**

> [Letterlijk citaat]

**Beleidsrelevantie:** [één alinea: hoe vult de Leidraad de wettelijke bepaling aan of in?]

Bij 0 resultaten: schrijf exact de standaardmelding uit Stap 3a.

*Sectie §8 wordt weggelaten als `[W]` ≠ IW 1990 en `[W]` ≠ UB IW. De secties §9–§12 nummeren niet door; gebruik altijd de nummers §9–§12 zoals hieronder.*

---

### §9 Juridische analyse

**§9.1 Grammaticale interpretatie**

Wat zegt de wetstekst letterlijk? Benoem de gewone betekenis van de sleuteltermen op basis van de in §1 geciteerde wetstekst. Verwijs naar specifieke formuleringen met lid en zinsdeel.

**§9.2 Systematische interpretatie**

Hoe past artikel [A] in de bredere wetsstructuur? Wat is de verhouding tot aangrenzende artikelen (uit §7.1) en andere wetten (uit §7.2)? Verwijs altijd naar concrete artikelnummers.

**§9.3 Teleologische interpretatie**

Wat is de ratio legis op basis van de wetstekst zelf en de wetsstructuur? Citeer de memorie van toelichting uitsluitend als de vindplaats (Kamerstukken II [jaar], [nr.], nr. [ondernr.], p. [X]) zeker is en markeer dit altijd als "Geverifieerd" of "Verificatie vereist". Fabriceer geen MvT-verwijzingen.

**§9.4 Spanning en meerduidigheid**

Gebruik uitsluitend de in §1–§7 gevonden wetstekst als grondslag.

| Punt | Omschrijving | Betrokken artikelen | Beoordeling |
|------|-------------|---------------------|-------------|
| [nr] | [omschrijving] | Art. X [wet] – Art. Y [wet] | Onduidelijk / Meerduidig / Conflicterend |

Bij geen spanningsvelden: schrijf exact "Op basis van de gevonden wetstekst zijn geen spanningsvelden geconstateerd."

---

### §10 Lacunes en ontbrekend beleid

| Lacune | Omschrijving | Betrokken artikelen | Aanbeveling |
|--------|-------------|---------------------|-------------|
| [nr] | [omschrijving] | Art. [A] lid Y | [aanbeveling] |

Bij geen lacunes: schrijf exact "Geen lacunes geconstateerd binnen het bereik van deze annotatie."

---

### §11 Conclusie

**§11.1 Kernbevindingen**

Geef minimaal 3 en maximaal 5 genummerde kernbevindingen. Elke bevinding heeft exact de volgende structuur:

**[Nr]. [Titel van de bevinding]**
*Vindplaats:* Art. [A], lid Y [wet]
*Betekenis:* [één zin over het juridische gevolg of de annotatiebevinding]

**§11.2 Onzekerheden en voorbehouden**

Benoem de resterende onzekerheden en de grenzen van de analyse. Altijd vermelden als teleologische interpretaties niet geverifieerd zijn.

---

### Bijlage A — Aanvullend geraadpleegde artikelen

Citeer hier de volledige, onbewerkte wetstekst van artikelen die als kruisreferentie zijn geraadpleegd (Stap 4) maar niet centraal staan in §1. Artikelen al geciteerd in §1 worden hier niet herhaald.

### Bijlage B — Geraadpleegde bronnen

| Bron | BWB-id | Peildatum (uit MCP) |
|------|--------|---------------------|
| [Wetnaam [W]] | [B] | [PD] |
| [Eventuele externe wet(ten) uit kruisreferenties] | [BWB-id] | [peildatum uit MCP] |
| Leidraad Invordering 2008 | BWBR0024096 | [peildatum uit MCP] *(alleen bij IW 1990 / UB IW)* |
| jas-kaders.md | — | [DATUM] |
| sjabloon-wetsanalyse.md | — | [DATUM] |

---

## Kwaliteitseisen (niet-onderhandelbaar)

- **Nooit parafraseren.** Wetstekst altijd letterlijk en volledig citeren in §1, §3, §4 en §8.
- **Wetstekst lezen voor elke claim.** Snippets zijn nooit voldoende grondslag; altijd de volledige artikeltekst ophalen.
- **Meest specifieke JAS-klasse.** Tijdsaanduiding boven variabele; plaatsaanduiding boven parameter.
- **13 JAS-elementen intern afgevinkt.** Alle 13 elementen doorlopen in Stap 5 (interne stap, niet in output).
- **Kruisreferenties alleen uit de tekst.** Uitsluitend letterlijk in de tekst staande verwijzingen; geen aanvullingen.
- **Delegatieketens volledig.** Wet → amvb → ministeriële regeling.
- **Interpretatiemethode per element.** Grammaticaal / systematisch / teleologisch in elke Toelichting-cel.
- **Spanning en meerduidigheid.** Altijd expliciet vermelden; bij geen spanning: vaste standaardzin.
- **Awb-toepasselijkheid.** Bij IW 1990-artikelen altijd §7.3 invullen op basis van art. 1 lid 2 IW 1990.
- **Leidraad altijd raadplegen.** Bij IW 1990 en UB IW altijd Stap 3a uitvoeren en §8 opnemen.
- **Peildatum uit MCP.** Gebruik de datum die het MCP-resultaat teruggeeft, nooit de datum van vandaag.
- **MvT-verwijzingen alleen geverifieerd.** Nooit Kamerstukken-verwijzingen fabriceren; altijd "Verificatie vereist" markeren.
- **Nulresultaat Leidraad: standaardmelding.** Gebruik exact de voorgeschreven tekst.
- **Altijd opslaan.** Rapport als MD-bestand in `analyses/` conform het bestandsnaamschema in Stap 8.
