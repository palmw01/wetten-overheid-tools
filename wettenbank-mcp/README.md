# Wettenbank MCP Server

Koppelt Claude Desktop aan **wetten.overheid.nl** via de publieke SRU-interface van KOOP.
Geen API-key nodig. Volledig open data (CC-0).

## Tools

| Tool | Omschrijving |
|---|---|
| `wettenbank_zoek` | Zoek op titel, rechtsgebied, ministerie, regelingsoort |
| `wettenbank_ophalen` | Volledige wetstekst via BWB-id (optioneel: historische versie) |
| `wettenbank_wijzigingen` | Gewijzigde regelingen sinds datum X |

## Installatie

```bash
npm install
npm run build
```

Noteer het absolute pad naar `dist/index.js`.

## Claude Desktop configuratie

Bestand: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wettenbank": {
      "command": "node",
      "args": ["/absoluut/pad/naar/wettenbank-mcp/dist/index.js"]
    }
  }
}
```

Herstart Claude Desktop. De tools zijn direct beschikbaar.

## Bekende BWB-id's (belastingrecht / invordering)

| Wet | BWB-id |
|---|---|
| Invorderingswet 1990 | BWBR0004770 |
| Leidraad Invordering 2008 | BWBR0004800 |
| Uitvoeringsbesluit Invorderingswet 1990 | BWBR0004772 |
| Algemene wet inzake rijksbelastingen (AWR) | BWBR0002320 |
| Algemene wet bestuursrecht (Awb) | BWBR0005537 |
| Wet inkomstenbelasting 2001 | BWBR0011353 |
| Wet op de vennootschapsbelasting 1969 | BWBR0002672 |
| Wet op de omzetbelasting 1968 | BWBR0002629 |
| Wet op de loonbelasting 1964 | BWBR0002471 |

## Technische details

- SRU endpoint: `https://zoekservice.overheid.nl/sru/Search`
- Repository: `https://repository.officiele-overheidspublicaties.nl/bwb/`
- Databron: KOOP (CC-0 licentie)
