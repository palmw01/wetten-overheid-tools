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

Het commando doorzoekt automatisch de volgende kernwetten via de MCP wettenbank:

| Wet | BWB-id |
|-----|--------|
| Invorderingswet 1990 | BWBR0004770 |
| Uitvoeringsbesluit IW 1990 | BWBR0004772 |
| AWR | BWBR0002320 |
| Awb | BWBR0005537 |

## Rapportstructuur

Elk rapport bevat:
1. **Statistieken** — treffers per wet, artikelnummers
2. **Vindplaatsen** — letterlijke wettekst per artikel
3. **Kruisreferenties** — interne en externe verwijzingen uitgewerkt
4. **Juridische samenvatting** — betekenis, samenhang, praktijkaandachtspunten
5. **Bronnen** — met geraadpleegde versie en peildatum
