# Juridisch Analyseschema (JAS) — Annotatiekaders v1.0.7

> Gebaseerd op: *Wetsanalyse met het juridisch analyseschema*, vastgesteld 7 oktober 2024  
> Uitgever: MinBZK | Licentie: CC0 | Canonieke URL: https://regels.overheid.nl/standaarden/wetsanalyse/v1.0.7  
> Theoretische basis: Wesley Newcomb Hohfeld (1913/1917) / de Blauwe Kamer (2012)

---

## Doel

Het JAS maakt het mogelijk wetgeving expliciet en gestructureerd te annoteren zodat:
- interpretatie- en preciseringskeuzes traceerbaar zijn;
- bij wetswijziging gemakkelijk te bepalen is welke aanpassingen nodig zijn;
- een kennismodel voor ICT-implementatie kan worden opgesteld.

Centraal principe: **elke conclusie moet terug te voeren zijn op wetgeving of officieel vastgesteld uitvoeringsbeleid.**

---

## Methodologische stappen

| Stap | Omschrijving |
|------|-------------|
| 1. Werkgebied bepalen | Scopebepaling: welke wetgeving en welk uitvoeringsbeleid valt binnen de analyse |
| 2. Structuur zichtbaar maken | Juridische "grammatica" identificeren; formuleringen classificeren in JAS-klassen |
| 3. Betekenis vastleggen | Begrippen definiëren met eigenschappen; interpretatie- en preciseringskeuzes expliciet vastleggen |
| 4. Analyseresultaten valideren | Toetsing met voorbeelden en juridische scenario's |
| 5. Ontbrekend beleid signaleren | Identificeren van lacunes in uitvoeringsbeleid |
| 6. Kennismodel opstellen | Samenhangend model voor implementatie in ICT-systemen |

---

## Taxonomie JAS-elementen

```
rechtssubject
rechtsobject
rechtsbetrekking
delegatiebevoegdheid
  └── delegatie-invulling
rechtsfeit
voorwaarde
  └── afleidingsregel
        ├── operator
        ├── variabele
        │     ├── variabelewaarde
        │     ├── tijdsaanduiding
        │     └── plaatsaanduiding
        └── parameter
              └── parameterwaarde
brondefinitie
```

---

## Annotatieregels per JAS-element

### 1. Rechtssubject

| Veld | Inhoud |
|------|--------|
| **Definitie** | Drager van rechten en plichten; partij in een rechtsbetrekking. Natuurlijke persoon of rechtspersoon. |
| **Herkenningsvraag** | *Wie* heeft het recht? *Wie* heeft de plicht? *Van wie* is een rechtsobject? *Bij wie* hoort een waarde? |
| **Taalkenmerken** | Zelfstandig naamwoord voor een persoon/entiteit; persoonlijk voornaamwoord (hij, zij, het); onbepaald/betrekkelijk voornaamwoord (iemand, een ieder, degene). |
| **Invorderingscontext** | Belastingschuldige (art. 3 IW 1990), ontvanger, aansprakelijkgestelde, schuldeiser, Staat. |

---

### 2. Rechtsobject

| Veld | Inhoud |
|------|--------|
| **Definitie** | Voorwerp van een rechtsbetrekking of rechtsfeit; fysiek of niet-fysiek. |
| **Herkenningsvraag** | *Wat* is het voorwerp van een recht of plicht? *Waarover* is iets verschuldigd? |
| **Taalkenmerken** | Zelfstandig naamwoord voor het onderwerp van de rechtsbetrekking; aanwijzend/betrekkelijk voornaamwoord (dat, hetgeen, welke). |
| **Invorderingscontext** | Belastingaanslag, naheffingsaanslag, dwangbevel, beslag, vordering, vermogensbestanddeel. |

---

### 3. Rechtsbetrekking

| Veld | Inhoud |
|------|--------|
| **Definitie** | Juridische relatie tussen twee rechtssubjecten: één rechthebbend, één plichthebbend. |
| **Herkenningsvraag** | *Hoe verhouden* twee rechtssubjecten zich tot elkaar? |
| **Taalkenmerken** | Werkwoord + hulpwerkwoord: recht (kan verzoeken, mag), plicht (stelt vast, is verplicht, dient te). Samengesteld: heeft recht op, heeft aanspraak op, heeft de plicht om. |
| **Invorderingscontext** | Betalingsplicht (art. 7 IW 1990), aanmaning, dwangbevel, uitstel van betaling, kwijtschelding. |

---

### 4. Rechtsfeit

| Veld | Inhoud |
|------|--------|
| **Definitie** | Handeling, gebeurtenis of tijdsverloop dat een wijziging in de juridische toestand teweegbrengt en een rechtsbetrekking creëert, wijzigt of beëindigt. |
| **Herkenningsvraag** | *Wat* is de gebeurtenis/handeling/het tijdsverloop dat gevolgen heeft voor de rechtsbetrekking? |
| **Taalkenmerken** | Actieve werkwoordsvorm (al dan niet met zelfstandig naamwoord): indienen van bezwaar, betekenen van dwangbevel, verstrijken van termijn. |
| **Invorderingscontext** | Dagtekening aanslag, verstrijken betalingstermijn, betekening dwangbevel, aanvraag uitstel, indiening bezwaarschrift. |

---

### 5. Voorwaarde

| Veld | Inhoud |
|------|--------|
| **Definitie** | Conditie die beschrijft aan welke omstandigheid voldaan moet zijn voor het intreden van een rechtsgevolg. Enkelvoudig of samengesteld (cumulatief EN / alternatief OF / negatie NIET). |
| **Herkenningsvraag** | *Welke eisen* worden gesteld? *Onder welke omstandigheden* geldt een bepaalde rechtsgevolg? |
| **Taalkenmerken** | Voegwoorden: indien, als, tenzij, mits, met dien verstande dat, met uitzondering van; bijwoorden bij werkwoord: schriftelijk, elektronisch. |
| **Invorderingscontext** | Voorwaarden voor uitstel (art. 25 IW 1990), kwijtscheldingscriteria (art. 26 IW 1990), aansprakelijkheidsdrempel. |

---

### 6. Afleidingsregel

| Veld | Inhoud |
|------|--------|
| **Definitie** | Regel die nieuwe feiten of waarden creëert op basis van bestaande feiten of waarden. Twee typen: **beslisregel** (ja/nee, recht bestaat of niet) en **rekenregel** (bedrag, duur, hoogte). De berekende variabele = **uitvoervariabele**; de inputvariabelen = **invoervariabelen**. |
| **Herkenningsvraag** | *Hoe wordt* een variabele berekend of afgeleid? *Hoe wordt* een specifiek rechtssubject of rechtsobject bepaald? |
| **Taalkenmerken** | Is verminderd met, bedraagt vermeerderd met, wordt gesteld op, is het gezamenlijke bedrag van, en. |
| **Invorderingscontext** | Berekening invorderingsrente (art. 28 IW 1990), vaststelling openstaand bedrag, belastingschuld na verrekening. |

---

### 7. Variabele / Variabelewaarde

| Veld | Inhoud |
|------|--------|
| **Definitie** | **Variabele**: kenmerk van een rechtssubject/object/betrekking/feit dat per instantie verschilt. **Variabelewaarde**: concrete waarde die een variabele kan hebben. |
| **Typen variabelewaarden** | (1) Getal/datum; (2) Tekst; (3) Enumeratiewaarde (limitatieve opsomming); (4) Booleaanse waarde (ja/nee). |
| **Herkenningsvraag** | *Welk bedrag, welke duur of welke hoogte* hoort bij deze variabele? Welk kenmerk wordt beschreven? |
| **Invorderingscontext** | Verschuldigd belastingbedrag, betalingstermijn, datum aanslag, inkomen belastingschuldige. |

---

### 8. Parameter / Parameterwaarde

| Veld | Inhoud |
|------|--------|
| **Definitie** | **Parameter**: vaste waarde over een periode, gelijk voor alle rechtssubjecten/objecten. Ook wel constante. **Parameterwaarde**: concrete waarde voor die periode. |
| **Herkenningsvraag** | Is sprake van een waarde die gedurende een periode *voor iedereen gelijk* is? |
| **Taalkenmerken** | Tarieven, (drempel)bedragen, maxima, minima, vrijstellingen; parameterwaarde als bedrag, percentage of datum. |
| **Invorderingscontext** | Invorderingsrentevoet (art. 29 IW 1990), wettelijk rentepercentage, griffierecht bedragen. |

---

### 9. Operator

| Veld | Inhoud |
|------|--------|
| **Definitie** | Woord, combinatie van woorden of teken dat een rekenkundige bewerking, samengestelde voorwaarde, gelijkstelling of vergelijking uitdrukt. |
| **Typen** | (a) **Rekenkundig**: +, −, ×, ÷ (vermenigvuldigen, aftrekken, optellen); (b) **Vergelijking**: groter dan, kleiner dan, gelijk aan; (c) **Logisch**: EN (cumulatief), OF (alternatief), NIET (negatie). |
| **Taalkenmerken** | Rekenkundig: het gezamenlijke bedrag van, de som van, vermeerderd met, verminderd met, percentage van. Vergelijking: groter dan, kleiner dan, meer bedraagt dan. Logisch: en, of, niet, ten minste. |
| **Invorderingscontext** | Berekening invorderingsrente (art. 28–29 IW 1990): "vermeerderd met", "percentage van"; voorwaardencombinatie bij aansprakelijkheid (art. 36 IW 1990): cumulatieve EN-operator; uitsluiting Algemene termijnenwet (art. 9 lid 10 IW): logische NIET-operator. |

---

### 10. Tijdsaanduiding

| Veld | Inhoud |
|------|--------|
| **Definitie** | Omschrijving van een tijdstip of tijdvak; duidt geldigheid van een rechtsbetrekking, tijdsverloop met rechtsgevolg, of een peildatum. |
| **Herkenningsvraag** | *Wanneer?* Seit wanneer of tot wanneer? Vanaf of tot welk moment? |
| **Taalkenmerken** | Concrete datum (1 januari 2025); omschrijving (de eerste dag van de maand); periodewoorden: jaar, maand, week, dag, kalenderjaar. |
| **Invorderingscontext** | Betalingstermijn van 6 weken (art. 9 IW 1990), aanvang invorderingsrente, verjaringstermijnen, peildata uitstel. |

---

### 11. Plaatsaanduiding

| Veld | Inhoud |
|------|--------|
| **Definitie** | Plaats of gebied waarvoor de wetgeving geldt; bepaalt toepassingsbereik. |
| **Herkenningsvraag** | *Waar* (voor welk gebied) geldt de regel (niet)? |
| **Taalkenmerken** | Algemeen (een lidstaat van de EU) of specifiek (Nederland, gemeente Amsterdam). |
| **Invorderingscontext** | Fiscale woonplaats, vestigingsplaats, grensoverschrijdende invordering (EU-richtlijn). |

---

### 12. Delegatiebevoegdheid / Delegatie-invulling

| Veld | Inhoud |
|------|--------|
| **Definitie** | **Delegatiebevoegdheid**: bevoegdheid om nadere regels te stellen in lagere regelgeving (verplicht of facultatief; subdelegatie mogelijk). **Delegatie-invulling**: de gedelegeerde regeling zelf. |
| **Herkenningsvraag** | Geeft een artikel *opdracht* nadere regels te stellen? Verwijst een bepaling *naar een hogere wet*? |
| **Taalkenmerken** | Verplicht: bij (of krachtens) amvb/ministeriële regeling worden regels gesteld. Facultatief: kunnen regels worden gesteld. Subdelegatie: bij of krachtens. |
| **Invorderingscontext** | Art. 73 IW 1990 → Uitvoeringsbesluit IW 1990 (UBIB 1990); nadere regels betalingsregelingen, uitstel, kwijtschelding. |

---

### 13. Brondefinitie

| Veld | Inhoud |
|------|--------|
| **Definitie** | Begripsomschrijving die expliciet is opgenomen in de wetgeving en een eenduidige betekenis geeft aan een gebruikte term. |
| **Herkenningsvraag** | Is deze term *uitdrukkelijk omschreven* in de wetgeving? |
| **Taalkenmerken** | Artikel met aanhef + onderdelen (bij voorkeur alfabetisch) aan het begin van de wet of voor een specifiek onderdeel. |
| **Invorderingscontext** | Art. 3 IW 1990 (belastingschuldige, ontvanger), art. 1 AWR (rijksbelastingen, inspecteur). |

---

## Annotatieprincipes

1. **Lees de wetstekst altijd eerst.** Snippets uit zoekresultaten zijn nooit voldoende grondslag voor annotaties.
2. **Citeer precies.** Elk geclassificeerd element verwijst naar het exacte artikel, lid en zinsdeel.
3. **Kies de meest specifieke klasse.** Tijdsaanduiding gaat boven variabele; plaatsaanduiding gaat boven parameter.
4. **Interpretatie expliciet benoemen.** Grammaticale, systematische en teleologische interpretatie afzonderlijk benoemen waar relevant.
5. **Spanning en meerduidigheid signaleren.** Benoem expliciet wanneer een bepaling onduidelijk is of conflicteert met andere regelgeving.
6. **Delegatieketens traceren.** Breng bij delegatiebevoegdheden altijd de volledige keten in kaart (wet → amvb → ministeriële regeling).

---

## Kleurcodering (gebruik in annotaties)

> **Let op:** De onderstaande kleurcodes zijn indicatief en gebaseerd op gangbare implementaties van de JAS-annotatie­tool. De officiële JAS-specificatie v1.0.7 schrijft geen vaste kleurwaarden voor. Pas de codes aan aan de tool die je gebruikt.

| Element | Kleurcode |
|---------|-----------|
| Rechtssubject | `#4472C4` (blauw) |
| Rechtsobject | `#70AD47` (groen) |
| Rechtsbetrekking | `#FF0000` (rood) |
| Rechtsfeit | `#FFC000` (oranje) |
| Voorwaarde | `#7030A0` (paars) |
| Afleidingsregel | `#00B0F0` (lichtblauw) |
| Variabele / waarde | `#92D050` (lichtgroen) |
| Parameter / waarde | `#FFD966` (geel) |
| Operator | `#808080` (grijs) |
| Tijdsaanduiding | `#F4B942` (goudgeel) |
| Plaatsaanduiding | `#9DC3E6` (lichtblauw) |
| Delegatiebevoegdheid | `#C9C9C9` (lichtgrijs) |
| Brondefinitie | `#D6B4C8` (roze) |

---

## Referenties

- JAS v1.0.7: https://regels.overheid.nl/standaarden/wetsanalyse/v1.0.7  
- NL-SBB (begrippenkader): https://docs.geostandaarden.nl/nl-sbb/nl-sbb/  
- Hohfeld (1913): *Some Fundamental Conceptions as Applied in Judicial Reasoning*, Yale Law Journal 23(1), p. 16-59  
- Hohfeld (1917): *Fundamental Legal Conceptions as Applied in Judicial Reasoning*, Yale Law Journal 26(8), p. 710-770
