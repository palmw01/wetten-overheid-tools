---
type: jas-annotatie
artikel: Art. 9.1 en 9.5 Leidraad Invordering 2008
wet: Leidraad Invordering 2008 (BWBR0024096)
datum: 2026-04-03
timestamp: 2026-04-03_22-39-50
peildatum: 2026-01-01
analist: Belastingdienst — Domein Inning
jas-versie: 1.0.7
---

# JAS-annotatie: Art. 9.1 en 9.5 Leidraad Invordering 2008
## Artikel 9 — Betalingstermijnen (secties 9.1 en 9.5)

**Analysedatum:** 2026-04-03
**Peildatum wetstekst:** 2026-01-01 (Leidraad Invordering 2008, geldig t/m 9999-12-31)
**Analist:** Belastingdienst — Domein Inning
**JAS-versie:** 1.0.7

> **Methodologische kanttekening:** De Leidraad Invordering 2008 is een beleidsregel (geen wet of amvb). JAS 1.0.7 is primair ontworpen voor statutaire bepalingen. De annotatie past de JAS-systematiek toe op beleidsregeltekst; waar de JAS-categorieën niet naadloos aansluiten op de beleidsregelstructuur wordt dit expliciet vermeld in de Toelichting-kolom.

---

## §1 Wetstekst (letterlijk, geldig per 2026-01-01)

**Artikel 9.1 Leidraad Invordering 2008 — Afwijking van de betalingstermijnen in geval van voorlopige aanslagen**

> In de gevallen waarin voor voorlopige aanslagen (bedoeld in artikel 9, vijfde lid, van de wet) die zijn gedagtekend in november of eerder, toepassing van de wet er toe zou leiden dat de enige of laatste betalingstermijn eindigt voor 31 december, dan wordt de vervaldag van deze termijn op 31 december gesteld. Bij afwijkende boekjaren wordt de laatste vervaldag steeds op de laatste dag van de maand gesteld.

**Artikel 9.5 Leidraad Invordering 2008 — Begrippen bij betalingstermijnen**

> Als de betalingstermijn van een aanslag is gesteld op één maand of is gesteld op zes weken, dan houdt dat in dat als de dagtekening van een aanslagbiljet valt op 31 oktober, de betalingstermijn van één maand vervalt op 30 november en de betalingstermijn van zes weken vervalt op 12 december. Als de dagtekening 28 februari is, dan vervalt de betalingstermijn van een maand op 31 maart en de betalingstermijn van zes weken op 11 april, tenzij het jaartal aangeeft dat het een schrikkeljaar is, in welk geval de termijn vervalt op 28 maart dan wel 10 april. Als de dagtekening van het aanslagbiljet valt op een andere dag dan de laatste dag van de kalendermaand, vervalt de termijn een maand later (bij een betalingstermijn van een maand) op de dag die hetzelfde nummer heeft als dat van de dagtekening. Als de dagtekening bijvoorbeeld 15 maart is, vervalt de termijn dus op 15 april. Is de betalingstermijn zes weken en is de dagtekening 15 maart, vervalt de termijn op 26 april.

---

## §2 Structuurdiagram

```
Art. 9.1 — Afwijkingsregel: vervaldag naar 31 december bij voorlopige aanslagen (art. 9 lid 5 IW 1990)
  └── subonderdeel — Bij afwijkende boekjaren: vervaldag naar laatste dag van de maand

Art. 9.5 — Berekeningsregels voor vervaldatum: uitleg begrippen "maand" en "zes weken"
  ├── scenario 1 — Dagtekening is laatste dag van de kalendermaand (bijv. 31 oktober, 28 februari)
  │     └── uitzondering — Schrikkeljaar bij dagtekening 28 februari
  └── scenario 2 — Dagtekening is andere dag dan laatste dag van de maand (bijv. 15 maart)
```

Art. 9.1 is een uitzonderingsregel op de betalingstermijnen van art. 9 lid 5 IW 1990: de vervaldag wordt uitgesteld naar 31 december indien de wet anders zou leiden tot een eerdere vervaldatum. Art. 9.5 bevat geen afwijkingsregel maar geeft rekenkundige uitleg over de wijze waarop termijnen van "één maand" en "zes weken" worden berekend.

---

## §3 Brondefinities

De Leidraad Invordering 2008 heeft geen zelfstandig begripsbepalings-artikel; de relevante definities zijn ontleend aan art. 2 IW 1990 ("de wet").

| Term | Definitie (letterlijk geciteerd) | Vindplaats | Reikwijdte |
|------|----------------------------------|------------|------------|
| belastingaanslag | "de voorlopige aanslag, de aanslag, de uitnodiging tot betaling, de navorderingsaanslag en de naheffingsaanslag, alsmede de voorlopige conserverende aanslag, de conserverende aanslag en de conserverende navorderingsaanslag in de inkomstenbelasting en in de schenk- en erfbelasting" | Art. 2 lid 1 sub m IW 1990 | Gehele IW 1990 |
| aanslagbiljet | "de kennisgeving van de beschikking of de uitspraak, bedoeld in onderdeel c" | Art. 2 lid 2 sub d IW 1990 | Gehele IW 1990 |

De term "voorlopige aanslagen" valt onder "belastingaanslag" (art. 2 lid 1 sub m IW 1990). De term "betalingstermijn" is niet als zodanig gedefinieerd; de termijnen worden geregeld in art. 9 IW 1990. De term "vervaldag" heeft geen zelfstandige definitie in de wet; het is de dag waarop een termijn eindigt (systematische uitleg uit art. 9 IW 1990).

---

## §4 JAS-annotatie per lid

> **Leeswijzer toelichting-kolom:** Vermeldt (1) toegepaste interpretatiemethode, (2) reden voor JAS-klasse boven alternatieven, (3) meerduidigheid of alternatieve classificatie.

### 4.1 Art. 9.1 — Afwijking vervaldag bij voorlopige aanslagen

| Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting |
|----|-----------------------------------|-------------|-------------|
| 1 | "voor voorlopige aanslagen (bedoeld in artikel 9, vijfde lid, van de wet)" | **Voorwaarde** | Grammaticaal/systematisch. De aanduiding "voor voorlopige aanslagen" omschrijft de categorie waarop de afwijkingsregel van toepassing is; dit is een toepassingsvoorwaarde. Alternatief: rechtsobject (de voorlopige aanslag als object van de afwijkingsregel), maar de functionele rol is conditioneel, niet objectief: de bepaling werkt alleen als aan deze categorie-eis is voldaan. De verwijzing naar art. 9 lid 5 IW 1990 is een brondefinitie-verwijzing ingebed in de voorwaarde. |
| 2 | "die zijn gedagtekend in november of eerder" | **Tijdsaanduiding** | Grammaticaal. De dagtekening in november of eerder is een expliciete temporele voorwaarde die het toepassingsbereik in de tijd bepaalt. De tijdsaanduiding is primair; het is ook een voorwaarde, maar tijdsaanduiding domineert per JAS-principe. "Of eerder" heeft logische OR-functie (zie nr. 3). |
| 3 | "of" (in "november of eerder") | **Operator** | Grammaticaal. Logische OR-operator: de tijdsaanduiding geldt voor dagtekening in november EN voor elke eerdere maand van het jaar. |
| 4 | "toepassing van de wet er toe zou leiden dat de enige of laatste betalingstermijn eindigt voor 31 december" | **Voorwaarde** | Grammaticaal/systematisch. Dit is de materiële toepassingsvoorwaarde (de counterfactual): de afwijkingsregel werkt alleen als strikte wetstoepassing zou leiden tot een vervaldatum vóór 31 december. Zonder deze conditie geen afwijking. Alternatief: afleidingsregel, maar dit onderdeel beschrijft de activerende conditie, niet de uitkomst. |
| 5 | "voor 31 december" | **Tijdsaanduiding** | Grammaticaal. De datum 31 december fungeert als referentiedatum voor de conditie van nr. 4. Tijdsaanduiding domineert boven parameter (vaste waarde). |
| 6 | "dan wordt de vervaldag van deze termijn op 31 december gesteld" | **Rechtsbetrekking** | Grammaticaal/systematisch. De beleidsregel stelt de vervaldag normatief op een nieuwe datum. "Wordt gesteld" drukt een prescriptieve norm uit: de ontvanger past de vervaldag aan. Dit is de kern van de rechtsbetrekking: de Belastingdienst (als normadressaat) stelt de vervaldatum op 31 december in plaats van de wettelijke datum. |
| 7 | "op 31 december" | **Tijdsaanduiding** | Grammaticaal. De datum 31 december is de nieuwe normatieve vervaldatum. Tijdsaanduiding domineert boven parameter/variabele: het is een concrete temporele aanduiding (zij het jaarlijks herhalend). |
| 8 | Volzin 1 als geheel | **Afleidingsregel** | Systematisch. Volzin 1 is een expliciete ALS-DAN-regel: ALS (voorlopige aanslag uit art. 9 lid 5 IW 1990) EN (dagtekening november of eerder) EN (wetstoepassing leidt tot vervaldatum vóór 31 december), DAN (vervaldag op 31 december stellen). Dit is de beslislogica van de afwijkingsregel. |
| 9 | "Bij afwijkende boekjaren wordt de laatste vervaldag steeds op de laatste dag van de maand gesteld" | **Afleidingsregel** | Grammaticaal/systematisch. Volzin 2 bevat een zelfstandige ALS-DAN-regel voor de bijzondere situatie van afwijkende boekjaren: ALS afwijkend boekjaar, DAN vervaldag op laatste dag van de maand. "Steeds" heeft de functie van een absolute operator (geen uitzonderingen). Alternatief: rechtsbetrekking, maar het is specifiek een rekenkundige beleidsregel (berekeningsregel voor vervaldatum), niet slechts een normatieve relatie. |
| 10 | "steeds" | **Operator** | Grammaticaal. "Steeds" is een universele kwantificator: de regel geldt zonder uitzondering voor elk geval van een afwijkend boekjaar. |
| 11 | "op de laatste dag van de maand" | **Tijdsaanduiding** | Grammaticaal. De laatste dag van de maand is de normatieve vervaldatum in de situatie van afwijkende boekjaren. Tijdsaanduiding domineert; de concrete datum is variabel per maand maar de temporele functie is leidend. |

### 4.2 Art. 9.5 — Berekeningsregels betalingstermijnen

| Nr | Formulering (letterlijk geciteerd) | JAS-element | Toelichting |
|----|-----------------------------------|-------------|-------------|
| 12 | "Als de betalingstermijn van een aanslag is gesteld op één maand of is gesteld op zes weken" | **Voorwaarde** | Grammaticaal. Toepassingsvoorwaarde: de berekeningsregels gelden uitsluitend voor termijnen van één maand of zes weken. Dit zijn de twee betalingstermijnen die art. 9 IW 1990 kent (leden 1 en 2). |
| 13 | "één maand" / "zes weken" | **Parameter / waarde** | Grammaticaal/systematisch. Vaste termijnduren gesteld in art. 9 IW 1990 — gelijk voor alle belastingschuldigen. Tijdsaanduiding domineert in principe, maar hier zijn "één maand" en "zes weken" invoerparameters van de rekenregel, niet een aanduiding van een concreet moment. Parameter is derhalve de juiste klasse. |
| 14 | "als de dagtekening van een aanslagbiljet valt op 31 oktober" | **Voorwaarde** | Grammaticaal. Scenario-voorwaarde voor het eerste rekenkundige voorbeeld: de berekening geldt als de dagtekening 31 oktober is (de laatste dag van oktober = de laatste dag van die kalendermaand). |
| 15 | "31 oktober" | **Tijdsaanduiding** | Grammaticaal. Concrete kalenderdatum als referentiepunt voor de berekening. Tijdsaanduiding domineert. |
| 16 | "de betalingstermijn van één maand vervalt op 30 november" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R1a: ALS dagtekening = 31 oktober EN termijn = 1 maand, DAN vervaldag = 30 november. De uitkomst is concreet bepaald. |
| 17 | "30 november" | **Tijdsaanduiding** | Grammaticaal. Berekende vervaldatum voor het scenario 31 oktober + 1 maand. |
| 18 | "de betalingstermijn van zes weken vervalt op 12 december" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R1b: ALS dagtekening = 31 oktober EN termijn = 6 weken, DAN vervaldag = 12 december. |
| 19 | "12 december" | **Tijdsaanduiding** | Grammaticaal. Berekende vervaldatum voor het scenario 31 oktober + 6 weken. |
| 20 | "Als de dagtekening 28 februari is" | **Voorwaarde** | Grammaticaal. Scenario-voorwaarde voor het tweede rekenkundige voorbeeld: dagtekening is 28 februari (de normale laatste dag van februari in een niet-schrikkeljaar). |
| 21 | "dan vervalt de betalingstermijn van een maand op 31 maart en de betalingstermijn van zes weken op 11 april" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R2a: ALS dagtekening = 28 februari (niet-schrikkeljaar), DAN: 1 maand → 31 maart; 6 weken → 11 april. Conjunctieve uitkomst (EN). |
| 22 | "31 maart" / "11 april" | **Tijdsaanduiding** | Grammaticaal. Berekende vervaldatums voor het 28-februari-scenario. |
| 23 | "tenzij het jaartal aangeeft dat het een schrikkeljaar is" | **Voorwaarde** | Grammaticaal. Uitzonderingsconditie (logische NIET-tenzij): de standaardregel van nr. 21 geldt niet als het een schrikkeljaar betreft. |
| 24 | "in welk geval de termijn vervalt op 28 maart dan wel 10 april" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R2b: ALS dagtekening = 28 februari EN schrikkeljaar, DAN: 1 maand → 28 maart; 6 weken → 10 april. "Dan wel" is een disjunctieve koppeling (afhankelijk van termijnduur). |
| 25 | "28 maart" / "10 april" | **Tijdsaanduiding** | Grammaticaal. Berekende vervaldatums voor het schrikkeljaar-scenario bij 28 februari. |
| 26 | "Als de dagtekening van het aanslagbiljet valt op een andere dag dan de laatste dag van de kalendermaand" | **Voorwaarde** | Grammaticaal. Restscenario-voorwaarde: alle gevallen van dagtekening op een andere dag dan de laatste dag van de maand (de algemene regel voor de meeste aanslagen). |
| 27 | "vervalt de termijn een maand later (bij een betalingstermijn van een maand) op de dag die hetzelfde nummer heeft als dat van de dagtekening" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R3 (algemene regel): ALS dagtekening ≠ laatste dag van maand EN termijn = 1 maand, DAN vervaldag = zelfde dag in volgende maand. Dit is de algemene kalenderregel voor maandberekening. |
| 28 | "Als de dagtekening bijvoorbeeld 15 maart is, vervalt de termijn dus op 15 april" | **Afleidingsregel** | Grammaticaal. Rekenregel R3-voorbeeld: ALS dagtekening = 15 maart EN termijn = 1 maand, DAN vervaldag = 15 april. Dit is een illustratief voorbeeld, geen zelfstandige rechtsregel; het verduidelijkt R3. |
| 29 | "15 maart" / "15 april" | **Tijdsaanduiding** | Grammaticaal. Voorbeelddatums ter illustratie van rekenregel R3. |
| 30 | "Is de betalingstermijn zes weken en is de dagtekening 15 maart, vervalt de termijn op 26 april" | **Afleidingsregel** | Grammaticaal/systematisch. Rekenregel R4: ALS dagtekening = 15 maart EN termijn = 6 weken, DAN vervaldag = 26 april (15 maart + 42 dagen). Sluit de systematiek af voor het 6-weken-scenario bij niet-laatste-dag-dagtekening. |
| 31 | "26 april" | **Tijdsaanduiding** | Grammaticaal. Berekende vervaldatum voor het 15-maart + 6-weken-scenario. |

### 4.3 Delegatiestructuur

Geen delegatiebevoegdheden in artikel 9.1 en 9.5. De Leidraad Invordering 2008 is zelf een beleidsregel op grond van art. 9 IW 1990; zij bevat geen verdere delegatie.

---

## §5 Afleidingsregels en rekenstructuur

**§5.1 Beslisregels**

| Beslisregel | Voorwaarden (EN/OF/NIET) | Uitkomst (ja/nee) | Vindplaats |
|-------------|--------------------------|-------------------|------------|
| Vervaldag-uitstelbepaling | (Voorlopige aanslag ex art. 9 lid 5 IW 1990) EN (dagtekening ≤ november) EN (wetstoepassing leidt tot vervaldatum < 31 december) | Ja: vervaldag op 31 december stellen | Art. 9.1, volzin 1 |
| Afwijkend boekjaar | (Afwijkend boekjaar) | Ja: vervaldag op laatste dag van de maand stellen | Art. 9.1, volzin 2 |

**§5.2 Rekenregels**

| Rekenregel | Formule | Invoervariabelen | Uitvoervariabele | Voorbeeld | Vindplaats |
|-----------|---------|-----------------|-----------------|-----------|------------|
| R1a: 1-maandtermijn bij maandeinde | Vervaldag = laatste dag van opvolgende maand | Dagtekening = laatste dag van kalendermaand; termijn = 1 maand | Vervaldatum | 31 okt + 1 maand = 30 nov | Art. 9.5, volzin 1 |
| R1b: 6-wekentermijn bij maandeinde | Vervaldag = dagtekening + 42 kalenderdagen | Dagtekening = laatste dag van kalendermaand; termijn = 6 weken | Vervaldatum | 31 okt + 42 dagen = 12 dec | Art. 9.5, volzin 1 |
| R2a: 28 feb, niet-schrikkeljaar | 1 maand → 31 mrt; 6 weken → 11 apr | Dagtekening = 28 feb; geen schrikkeljaar | Vervaldatum | 28 feb + 1 mnd = 31 mrt; + 6 wkn = 11 apr | Art. 9.5, volzin 2 |
| R2b: 28 feb, schrikkeljaar | 1 maand → 28 mrt; 6 weken → 10 apr | Dagtekening = 28 feb; schrikkeljaar | Vervaldatum | 28 feb + 1 mnd = 28 mrt; + 6 wkn = 10 apr | Art. 9.5, volzin 2 |
| R3: 1-maandtermijn, niet-maandeinde | Vervaldag = dagtekening + 1 kalendermaand (zelfde dag van volgende maand) | Dagtekening ≠ laatste dag van maand; termijn = 1 maand | Vervaldatum | 15 mrt + 1 mnd = 15 apr | Art. 9.5, volzinnen 3–4 |
| R4: 6-wekentermijn, niet-maandeinde | Vervaldag = dagtekening + 42 kalenderdagen | Dagtekening ≠ laatste dag van maand; termijn = 6 weken | Vervaldatum | 15 mrt + 42 dagen = 26 apr | Art. 9.5, volzin 5 |

**§5.3 Parameters (vaste waarden)**

| Parameter | Waarde | Geldig per | Vindplaats |
|-----------|--------|-----------|------------|
| Betalingstermijn belastingaanslag (standaard) | 6 weken | 2026-01-01 | Art. 9 lid 1 IW 1990 (via art. 9.5 LI) |
| Betalingstermijn navorderingsaanslag | 1 maand | 2026-01-01 | Art. 9 lid 2 IW 1990 (via art. 9.5 LI) |
| Uitsteldatum voor vervaldatum (art. 9.1) | 31 december | 2026-01-01 | Art. 9.1 LI, volzin 1 |

---

## §6 Termijnen en tijdsaanduidingen

| Termijn / Tijdstip | Duur / Datum | Aanvang | Einde | Rechtsgevolg | Vindplaats |
|-------------------|-------------|---------|-------|-------------|------------|
| Betalingstermijn (1 maand) | 1 kalendermaand | Dag van dagtekening aanslagbiljet | Zie rekenregels R1a, R2a, R2b, R3 | Aanslag invorderbaar | Art. 9.5, volzinnen 1–4 |
| Betalingstermijn (6 weken) | 42 kalenderdagen | Dag van dagtekening aanslagbiljet | Zie rekenregels R1b, R2a, R2b, R4 | Aanslag invorderbaar | Art. 9.5, volzinnen 1–2, 5 |
| Uitgestelde vervaldag (art. 9.1) | Tot 31 december | Oorspronkelijke wettelijke vervaldatum | 31 december van het belastingjaar | Termijn eindigt niet vóór 31 dec. | Art. 9.1, volzin 1 |
| Uitgestelde vervaldag bij afwijkend boekjaar | Laatste dag van de maand | Niet nader bepaald in art. 9.1 | Laatste dag van de maand | Idem, boekjaarsynchronisatie | Art. 9.1, volzin 2 |

---

## §7 Kruisreferenties

**§7.1 Interne verwijzingen (binnen Leidraad Invordering 2008)**

Geen interne verwijzingen in de tekst van artikel 9.1 en 9.5.

**§7.2 Externe verwijzingen (naar andere wetten)**

| Artikel (bron) | Verwijst naar | Wet | Letterlijke verwijzingstekst | Geciteerde doeltekst |
|----------------|---------------|-----|------------------------------|----------------------|
| Art. 9.1 LI | Art. 9 lid 5 | IW 1990 | "bedoeld in artikel 9, vijfde lid, van de wet" | "In afwijking van het eerste lid is een voorlopige aanslag in de inkomstenbelasting of in de vennootschapsbelasting en een voorlopige conserverende aanslag in de inkomstenbelasting, waarvan het aanslagbiljet een dagtekening heeft die ligt in het jaar waarover deze is vastgesteld, invorderbaar in zoveel gelijke termijnen als er na de maand, die in de dagtekening van het aanslagbiljet is vermeld, nog maanden van het jaar overblijven. De eerste termijn vervalt één maand na de dagtekening van het aanslagbiljet en elk van de volgende termijnen telkens een maand later. Indien de toepassing van de eerste volzin niet leidt tot meer dan één termijn, vindt het eerste lid toepassing." |

**§7.3 Awb-toepasselijkheid**

Niet van toepassing: `[W]` = Leidraad Invordering 2008 (niet IW 1990).

---

## §9 Juridische analyse

**§9.1 Grammaticale interpretatie**

Art. 9.1 hanteert een dubbele conditionele structuur: de afwijkingsregel werkt alleen als (a) de aanslag een voorlopige aanslag is in de zin van art. 9 lid 5 IW 1990 én (b) de dagtekening in november of eerder valt én (c) wetstoepassing zou leiden tot een vervaldatum vóór 31 december. De Leidraad gebruikt de formulering "wordt de vervaldag ... op 31 december gesteld", wat een prescriptieve norm is: de ontvanger stelt de vervaldag eenzijdig bij.

Art. 9.5 gebruikt systematisch "als... dan"-constructies voor vijf onderscheiden scenario's. De tekst werkt inductief: van concrete voorbeelden (31 oktober, 28 februari, 15 maart) naar de achterliggende rekenregel. De uitdrukking "de dag die hetzelfde nummer heeft als dat van de dagtekening" geeft de algemene maandberekeningsregel: niet 30 of 31 dagen optellen, maar de overeenkomstige dag van de volgende maand nemen.

**§9.2 Systematische interpretatie**

Art. 9.1 LI is een uitvoeringsbepaling bij art. 9 lid 5 IW 1990. Lid 5 regelt de gespreide invordering van voorlopige aanslagen in het belastingjaar: zoveel termijnen als er maanden resteren. Als een aanslag laat in het jaar wordt opgelegd (bijv. oktober), resteert slechts één termijn, die zonder afwijkingsregel in december zou vallen vóór 31 december. Art. 9.1 LI corrigeert dit door de vervaldag naar 31 december te verschuiven, zodat de belastingschuldige altijd de laatste dag van het jaar als uiterste termijn heeft.

Art. 9.5 LI vult de open norm in art. 9 IW 1990 in. Art. 9 IW 1990 noemt termijnen van "zes weken" (lid 1) en "één maand" (lid 2) maar geeft geen rekenregel voor de berekening van de vervaldatum. Art. 9.5 LI geeft die rekenregel op beleidsregelniveau, waarmee de uitvoering uniform wordt. De bepaling codificeert de kalenderrekenregels voor maanden en weken.

**§9.3 Teleologische interpretatie**

De ratio van art. 9.1 LI is het voorkomen van een onbillijk korte betalingstermijn voor belastingschuldigen bij wie de voorlopige aanslag laat in het jaar wordt opgelegd. Door de vervaldag naar 31 december te verplaatsen, wordt de wettelijke gespreide-termijnenregeling van art. 9 lid 5 IW 1990 reëel uitvoerbaar gemaakt.

De ratio van art. 9.5 LI is uniforme toepassing van de wettelijke termijnen door de Belastingdienst. Zonder expliciete rekenregel zouden de begrippen "maand" en "zes weken" in art. 9 IW 1990 tot uiteenlopende uitleg kunnen leiden (bijv. bij maandeinde of schrikkeljaar). Art. 9.5 LI elimineert deze onzekerheid door de berekeningswijze te standaardiseren.

*MvT-verwijzingen: niet geverifieerd; de Leidraad is een beleidsregel zonder formele parlementaire toelichting.*

**§9.4 Spanning en meerduidigheid**

| Punt | Omschrijving | Betrokken artikelen | Beoordeling |
|------|-------------|---------------------|-------------|
| 1 | Art. 9.1 LI verwijst uitsluitend naar "voorlopige aanslagen (bedoeld in artikel 9, vijfde lid, van de wet)". De bepaling is daarmee niet van toepassing op voorlopige teruggaven (art. 9 lid 6 IW 1990) of op voorlopige aanslagen met een dagtekening vóór het belastingjaar (art. 9 lid 7 IW 1990). Dit kan in de praktijk tot discussie leiden wanneer verwante termijnproblemen ontstaan bij die andere categorieën. | Art. 9.1 LI – art. 9 leden 6 en 7 IW 1990 | Onduidelijk (beperkt toepassingsbereik) |
| 2 | Art. 9.5 LI geeft de rekenregel voor "één maand" en "zes weken" maar is stilzwijgend over de situatie waarbij de dagtekening valt op de 29e, 30e of 31e van een maand (en de opvolgende maand korter is). De tekst noemt alleen "31 oktober → 30 november" en "28 februari → 31 maart/28 maart" als voorbeelden voor maandeinde-situaties. De regel voor bijv. 30 januari (→ 28/29 februari?) is niet uitgeschreven. | Art. 9.5 LI | Meerduidig (leemte bij korte opvolgende maanden anders dan februari) |

---

## §10 Lacunes en ontbrekend beleid

| Lacune | Omschrijving | Betrokken artikelen | Aanbeveling |
|--------|-------------|---------------------|-------------|
| 1 | Art. 9.5 LI behandelt de berekening van "één maand" en "zes weken" uitsluitend via voorbeelden. De algemene rekenregel voor de situatie waarbij de dagtekening valt op de 29e, 30e of 31e van een maand en de opvolgende maand korter is (bijv. 31 jan + 1 maand), is niet uitgeschreven. Dit is een uitvoeringsleemte. | Art. 9.5 LI | Aanvulling in de Leidraad met een expliciete rekenregel voor kortere opvolgende maanden. |
| 2 | Art. 9.1 LI regelt de verschuiving naar 31 december voor voorlopige aanslagen op grond van art. 9 lid 5 IW 1990. Er is geen vergelijkbare bepaling voor de situatie van art. 9 lid 7 IW 1990 (voorlopige aanslagen met dagtekening vóór het belastingjaar) waarbij vergelijkbare termijnproblemen kunnen optreden. | Art. 9.1 LI – art. 9 lid 7 IW 1990 | Beleidsmatige afstemming en eventuele uitbreiding van art. 9.1 LI naar de lid-7-situatie. |

---

## §11 Conclusie

**§11.1 Kernbevindingen**

**1. Art. 9.1 LI is een drempelregel met drie cumulatieve voorwaarden**
*Vindplaats:* Art. 9.1 LI, volzin 1
*Betekenis:* De vervaldag-uitstelbepaling werkt uitsluitend als alle drie de condities gelijktijdig vervuld zijn: (a) voorlopige aanslag ex art. 9 lid 5 IW 1990, (b) dagtekening in november of eerder, én (c) wetstoepassing leidt tot vervaldatum vóór 31 december.

**2. Art. 9.1 LI corrigeert een onbillijkheid bij late oplegging voorlopige aanslagen**
*Vindplaats:* Art. 9.1 LI, volzin 1 juncto art. 9 lid 5 IW 1990
*Betekenis:* Zonder art. 9.1 LI zou de laatste termijn van een laat opgelegde voorlopige aanslag vóór 31 december vallen, waardoor de belastingschuldige minder tijd heeft dan het wettelijke systeem beoogt; art. 9.1 LI herstelt dit.

**3. Art. 9.5 LI geeft de ontbrekende rekenregel voor "maand" en "zes weken" in art. 9 IW 1990**
*Vindplaats:* Art. 9.5 LI, volzinnen 1–5
*Betekenis:* Art. 9 IW 1990 noemt de termijnduren maar legt de berekeningswijze niet vast; art. 9.5 LI vult deze lacune op beleidsregelniveau in met zes rekenregels (R1a–R4).

**4. De rekenregel voor maandeinde-situaties in art. 9.5 LI is niet volledig uitgeschreven**
*Vindplaats:* Art. 9.5 LI
*Betekenis:* De berekening van vervaldatums bij dagtekening op de 29e, 30e of 31e van een maand (anders dan de uitgewerkte gevallen 31 oktober en 28 februari) is niet expliciet geregeld, wat uitvoeringsrisico creëert.

**5. Beperkt toepassingsbereik art. 9.1 LI ten opzichte van art. 9 IW 1990**
*Vindplaats:* Art. 9.1 LI juncto art. 9 leden 6 en 7 IW 1990
*Betekenis:* Art. 9.1 LI ziet uitsluitend op art. 9 lid 5 IW 1990; vergelijkbare termijnproblemen bij art. 9 leden 6 en 7 vallen buiten het bereik van de beleidsregel.

**§11.2 Onzekerheden en voorbehouden**

- De Leidraad Invordering 2008 is een beleidsregel van de Staatssecretaris van Financiën en bindt primair de Belastingdienst (ontvanger). De belastingschuldige kan er rechtstreeks een beroep op doen via het vertrouwensbeginsel; de Leidraad heeft geen formeel-juridische kracht van wet.
- De rekenregels in art. 9.5 LI zijn niet geverifieerd aan de hand van de Algemene termijnenwet, die op grond van art. 9 lid 10 IW 1990 uitdrukkelijk niet van toepassing is op de termijnen van art. 9 IW 1990.
- De teleologische interpretatie berust op de wetsstructuur; MvT-verwijzingen zijn niet geverifieerd.

---

## Bijlage A — Aanvullend geraadpleegde artikelen

**Art. 9 IW 1990 (peildatum 2026-01-01)**

> **1** Een belastingaanslag is invorderbaar zes weken na de dagtekening van het aanslagbiljet.
>
> **2** In afwijking van het eerste lid is een navorderingsaanslag, alsmede een conserverende navorderingsaanslag invorderbaar één maand na de dagtekening van het aanslagbiljet en een naheffingsaanslag invorderbaar veertien dagen na de dagtekening van het aanslagbiljet.
>
> **3** Een ingevolge artikel 2, tweede lid, onderdeel c, met een belastingaanslag gelijkgestelde beschikking inzake een bestuurlijke boete die gelijktijdig en in verband met de vaststelling van een belastingaanslag als bedoeld in artikel 2, eerste lid, onderdeel m, is opgelegd, is invorderbaar overeenkomstig de bepalingen die gelden voor die belastingaanslag. Een ingevolge artikel 2, tweede lid, onderdeel c, met een belastingaanslag gelijkgestelde beschikking inzake belasting- of revisierente is invorderbaar overeenkomstig de bepalingen die gelden voor de belastingaanslag, bedoeld in artikel 2, eerste lid, onderdeel m, waarop de belasting- of revisierente betrekking heeft.
>
> **4** Een uitnodiging tot betaling, alsmede een ingevolge artikel 2, tweede lid, onderdeel c, met een belastingaanslag gelijkgestelde beschikking inzake rente op achterstallen, inzake kosten van ambtelijke werkzaamheden of inzake een bestuurlijke boete als bedoeld in hoofdstuk 9 van de Algemene douanewet, is invorderbaar tien dagen na de dagtekening van het aanslagbiljet.
>
> **5** In afwijking van het eerste lid is een voorlopige aanslag in de inkomstenbelasting of in de vennootschapsbelasting en een voorlopige conserverende aanslag in de inkomstenbelasting, waarvan het aanslagbiljet een dagtekening heeft die ligt in het jaar waarover deze is vastgesteld, invorderbaar in zoveel gelijke termijnen als er na de maand, die in de dagtekening van het aanslagbiljet is vermeld, nog maanden van het jaar overblijven. De eerste termijn vervalt één maand na de dagtekening van het aanslagbiljet en elk van de volgende termijnen telkens een maand later. Indien de toepassing van de eerste volzin niet leidt tot meer dan één termijn, vindt het eerste lid toepassing.
>
> **6** In afwijking van het eerste en het vijfde lid is een belastingaanslag als bedoeld in het vijfde lid, die een uit te betalen bedrag behelst, invorderbaar in zoveel gelijke termijnen als er met inbegrip van de maand die in de dagtekening van het aanslagbiljet is vermeld, nog maanden van het jaar overblijven. De eerste termijn vervalt aan het eind van de maand van de dagtekening van het aanslagbiljet en elk van de volgende termijnen telkens een maand later.
>
> **7** In afwijking van het eerste lid is een voorlopige aanslag waarvan het aanslagbiljet een dagtekening heeft die ligt voor het jaar waarover deze is vastgesteld, invorderbaar in zoveel gelijke termijnen als er maanden van het jaar zijn. De eerste termijn vervalt aan het eind van de eerste maand van het jaar waarover de voorlopige aanslag is vastgesteld en elk van de volgende termijnen telkens een maand later.
>
> **10** De Algemene termijnenwet is niet van toepassing op de in de voorgaande leden gestelde termijnen.
>
> **12** De verplichting tot betaling wordt niet geschorst door de indiening van een bezwaar- of beroepschrift inzake een belastingaanslag.

*(Leden 8, 9 en 11 zijn weggelaten als niet relevant voor de annotatie van art. 9.1 en 9.5 LI.)*

---

## Bijlage B — Geraadpleegde bronnen

| Bron | BWB-id | Peildatum (uit MCP) |
|------|--------|---------------------|
| Leidraad Invordering 2008 | BWBR0024096 | 2026-01-01 |
| Invorderingswet 1990 (art. 9 en art. 2) | BWBR0004770 | 2026-01-01 |
| jas-kaders.md | — | 2026-04-03 |
