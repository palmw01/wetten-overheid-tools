# JAS-annotatie — Rapportformat en kwaliteitseisen

## Frontmatter (YAML)

```
---
type: jas-annotatie
artikel: [volledige artikelreferentie, bijv. Art. 25 IW 1990]
wet: [volledige wetnaam (BWB-id)]
datum: [YYYY-MM-DD]
timestamp: [YYYY-MM-DD_HH-MM-SS]
peildatum: [peildatum uit MCP]
analist: Belastingdienst — Domein Inning
jas-versie: 1.0.10
---
```

---

## Rapportheader

```
# JAS-annotatie: [Volledige artikelreferentie]
## [Naam van het hoofdstuk / de afdeling, letterlijk uit de wetstekst]

**Analysedatum:** [DATUM]
**Peildatum wetstekst:** [PD] ([wet], geldig t/m [vervaldatum uit MCP])
**Analist:** Belastingdienst — Domein Inning
**JAS-versie:** 1.0.10
```

---

## §1 Wetstekst (letterlijk, geldig per [PD])

Citeer de volledige, letterlijke tekst van artikel `[A]`. Elk lid op een nieuwe regel met vetgedrukt lidnummer (`> **1** ...`). Geen parafrase, geen samenvatting.

---

## §2 Structuurdiagram

Vermeld eerst de structuurpositie van het artikel, **letterlijk overgenomen uit de structuurregels boven de artikelkop in de MCP-response** (elk niveau staat op een eigen regel):

> **Structuurpositie:** Hoofdstuk X — titel > Afdeling Y — titel > ...

Als de MCP-response geen structuurregels boven de artikelkop bevat: schrijf "Structuurpositie niet beschikbaar in MCP-response." Neem nooit een hoofdstuktitel aan op basis van de artikelinhoud.

Breng daarna de interne relaties tussen de leden in kaart: welk lid is de hoofdregel, welke leden zijn afwijkingen, uitzonderingen of nadere invullingen. Gebruik een boomstructuur met ├── en └── vertakkingen.

Bij een enkel lid zonder interne structuur: schrijf "Artikel [A] heeft één lid; geen interne structuurverhouding."

---

## §3 Brondefinities

Citeer alle begripsomschrijvingen (uit het begripsbepalings-artikel) die betrekking hebben op termen in artikel `[A]`. Elke definitie letterlijk geciteerd.

| Term | Definitie (letterlijk geciteerd) | Vindplaats | Reikwijdte |
|------|----------------------------------|------------|------------|
| [term] | "[letterlijk citaat]" | Art. [BD] lid Y sub z [wet] | [bijv. "Gehele IW 1990"] |

Bij geen relevante brondefinities: schrijf exact "Geen brondefinities van toepassing voor de termen in artikel [A]."

---

## §4 JAS-annotatie per lid

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

De sectienummering is dynamisch: bij N leden is de delegatiestructuur §4.(N+1).

Bij geen delegatie: schrijf exact "Geen delegatiebevoegdheden in artikel [A]."

---

## §5 Afleidingsregels en rekenstructuur

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

## §6 Termijnen en tijdsaanduidingen

| Termijn / Tijdstip | Duur / Datum | Aanvang | Einde | Rechtsgevolg | Vindplaats |
|-------------------|-------------|---------|-------|-------------|------------|
| [naam] | [duur] | [aanvang] | [einde] | [rechtsgevolg] | Art. [A] lid Y |

Bij geen termijnen: schrijf exact "Geen termijnen in artikel [A]."

---

## §7 Kruisreferenties

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

## §8 Beleidskader: Leidraad Invordering *(alleen opnemen als `[W]` = IW 1990 of UB IW)*

Citeer de gevonden Leidraad-bepalingen letterlijk als blokcitaat.

**Leidraad Invordering 2008 — [vindplaats]**

> [Letterlijk citaat]

**Beleidsrelevantie:** [één alinea: hoe vult de Leidraad de wettelijke bepaling aan of in?]

Bij 0 resultaten: schrijf exact "De Leidraad Invordering 2008 bevat geen overeenkomstig artikel [A]. §8 wordt weggelaten."

*Sectie §8 wordt weggelaten als `[W]` ≠ IW 1990 en `[W]` ≠ UB IW. De secties §9–§11 nummeren niet door; gebruik altijd de nummers §9–§11 zoals hieronder.*

---

## §9 Juridische analyse

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

## §10 Lacunes en ontbrekend beleid

| Lacune | Omschrijving | Betrokken artikelen | Aanbeveling |
|--------|-------------|---------------------|-------------|
| [nr] | [omschrijving] | Art. [A] lid Y | [aanbeveling] |

Bij geen lacunes: schrijf exact "Geen lacunes geconstateerd binnen het bereik van deze annotatie."

---

## §11 Conclusie

**§11.1 Kernbevindingen**

Geef minimaal 3 en maximaal 5 genummerde kernbevindingen. Elke bevinding heeft exact de volgende structuur:

**[Nr]. [Titel van de bevinding]**
*Vindplaats:* Art. [A], lid Y [wet]
*Betekenis:* [één zin over het juridische gevolg of de annotatiebevinding]

**§11.2 Onzekerheden en voorbehouden**

Benoem de resterende onzekerheden en de grenzen van de analyse. Altijd vermelden als teleologische interpretaties niet geverifieerd zijn.

---

## Bijlage A — Aanvullend geraadpleegde artikelen

Citeer hier de volledige, onbewerkte wetstekst van artikelen die als kruisreferentie zijn geraadpleegd maar niet centraal staan in §1. Artikelen al geciteerd in §1 worden hier niet herhaald.

## Bijlage B — Geraadpleegde bronnen

| Bron | BWB-id | Peildatum (uit MCP) | JCI-uri (uit MCP) |
|------|--------|---------------------|-------------------|
| [Wetnaam [W]] | [B] | [PD] | [jci1.3:c:[B]&artikel=[A]] |
| [Eventuele externe wet(ten) uit kruisreferenties] | [BWB-id] | [peildatum uit MCP] | [jci1.3:c:...&artikel=X] |
| Leidraad Invordering 2008 | BWBR0024096 | [peildatum uit MCP] | [jci1.3:c:BWBR0024096&artikel=[A]] *(alleen bij IW 1990 / UB IW)* |
| kaders.md | — | [DATUM] | — |

---

## Kwaliteitseisen (niet-onderhandelbaar)

- **Nooit parafraseren.** Wetstekst altijd letterlijk en volledig citeren in §1, §3, §4 en §8.
- **Wetstekst lezen voor elke claim.** Snippets zijn nooit voldoende grondslag; altijd de volledige artikeltekst ophalen.
- **Meest specifieke JAS-klasse.** Tijdsaanduiding boven variabele; plaatsaanduiding boven parameter.
- **13 JAS-elementen intern afgevinkt.** Alle 13 elementen doorlopen (interne stap, niet in output).
- **Kruisreferenties alleen uit de tekst.** Uitsluitend letterlijk in de tekst staande verwijzingen; geen aanvullingen.
- **Delegatieketens volledig.** Wet → amvb → ministeriële regeling; alle schakels ophalen.
- **Interpretatiemethode per element.** Grammaticaal / systematisch / teleologisch in elke Toelichting-cel.
- **Spanning en meerduidigheid.** Altijd expliciet vermelden; bij geen spanning: vaste standaardzin.
- **Awb-toepasselijkheid.** Bij IW 1990-artikelen altijd §7.3 invullen op basis van art. 1 lid 2 IW 1990.
- **Leidraad altijd raadplegen.** Bij IW 1990 en UB IW altijd §8 opnemen.
- **Peildatum uit MCP.** Gebruik de datum die het MCP-resultaat teruggeeft, nooit de datum van vandaag.
- **MvT-verwijzingen alleen geverifieerd.** Nooit Kamerstukken-verwijzingen fabriceren; altijd "Verificatie vereist" markeren.
- **Nulresultaat Leidraad: standaardmelding.** Gebruik exact de voorgeschreven tekst.
- **Altijd opslaan.** Rapport als MD-bestand in `analyses/` conform het bestandsnaamschema.

---

## Pre-save checklist (doorlopen vóór opslaan)

- [ ] §1: wetstekst letterlijk geciteerd, peildatum uit MCP
- [ ] §2: structuurpositie letterlijk overgenomen uit de structuurregels boven de artikelkop in MCP-response — nooit aangenomen of afgeleid uit artikelinhoud
- [ ] §4: alle 13 JAS-elementen beoordeeld per lid (afwezig = expliciet vermeld als "n.v.t.")
- [ ] §4.[N+1]: delegatieketens volledig (alle schakels opgehaald)
- [ ] §5: beslisregels, rekenregels én parameters aanwezig (of standaardmelding)
- [ ] §6: alle termijnen met rechtsgevolg bij overschrijding (of standaardmelding)
- [ ] §7.3: Awb-toepasselijkheid via art. 1 lid 2 IW 1990 (bij IW 1990)
- [ ] §8: Leidraad letterlijk geciteerd, beleidsruimte benoemd (bij IW 1990/UB IW)
- [ ] §9: drie interpretatiemethoden doorlopen, spanningsvelden benoemd
- [ ] §11: onzekerheden expliciet, geen schijnzekerheid
- [ ] Bestandsnaam conform: `jas-annotatie-art[A]-[wet]-[TIMESTAMP].md`
