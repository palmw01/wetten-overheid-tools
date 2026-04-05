# Wetsanalyse — Rapporten

Deze map bevat rapporten gegenereerd via het `/wetzoek` commando.

## Naamconventie

```
[zoekterm]-[YYYY-MM-DD_HH-MM-SS].md
```

De timestamp maakt elk rapport nagenoeg uniek, ook bij herhaalde zoekopdrachten met dezelfde term.

Voorbeelden:
- `termijnen-2026-04-01_14-32-07.md`
- `aansprakelijkheid-2026-04-01_09-15-44.md`
- `uitstel van betaling-2026-04-01_16-00-01.md`

## Gebruik

Roep vanuit het project aan:

```
/wetzoek termijnen
/wetzoek aansprakelijkheid
/wetzoek uitstel van betaling
/wetzoek dwangbevel
```

Het commando doorzoekt automatisch de volgende kernbronnen via de MCP wettenbank:

| Bron | BWB-id |
|------|--------|
| Invorderingswet 1990 | BWBR0004770 |
| Leidraad Invordering 2008 | BWBR0024096 |
| Uitvoeringsbesluit IW 1990 | BWBR0004772 |
| AWR | BWBR0002320 |
| Awb | BWBR0005537 |

## Rapportstructuur

Elk `/wetzoek`-rapport bevat:
1. **Statistieken** — treffers per bron, artikelnummers, gezochte varianten
2. **Vindplaatsen** — letterlijke wetstekst per artikel (nooit parafrase)
3. **Kruisreferenties** — intern (binnen wet) en extern (naar andere wet), incl. Awb-toepasselijkheidscheck
4. **Juridische samenvatting** — betekenis, samenhang, spanningsvelden, praktijkaandachtspunten, jurisprudentie
5. **Bronnen** — per bron met geldigheidsdatum (peildatum)

## JAS-annotaties

Naast `/wetzoek`-rapporten bevat deze map ook JAS-annotaties van afzonderlijke wetsartikelen.
Naamconventie: `jas-annotatie-[artikel]-[wet]-[timestamp].md`

Voorbeeld: `jas-annotatie-art9-iw1990-2026-04-02_08-57-55.md`

Een JAS-annotatie classificeert elke formulering in het artikel conform het Juridisch Analyseschema v1.0.10.
Zie `jas-kaders.md` voor de volledige annotatiekaders.
