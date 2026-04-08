# Wetten Overheid — Juridische wetsanalyse met AI

Werkruimte voor gestructureerde wetsanalyse op het domein **invordering van rijksbelastingen**, aangedreven door Claude Code en een MCP-koppeling met [wetten.overheid.nl](https://wetten.overheid.nl).

---

## Wat zit er in deze repo?

```
wettenbank-mcp/                    MCP-server: koppelt Claude aan wetten.overheid.nl
analyses/                          Gegenereerde JAS-annotaties
CLAUDE.md                          Werkafspraken voor Claude (rol, betrouwbaarheidsregels)
.claude/skills/jas/
    SKILL.md                       /jas skill — werkwijze stap 0–10, MCP-strategie (context:fork)
    kaders.md                      JAS v1.0.10 — 13 annotatiekaders + taxonomie
    rapportformat.md               §1–§11 structuur + pre-save checklist
```

De skills draaien in een geïsoleerde fork-context (`context: fork`): alle MCP-aanroepen, wetstekst en analyse blijven buiten de hoofdconversatie. De hoofdconversatie ontvangt alleen het bestandspad van het opgeslagen rapport.

---

## Wettenbank MCP-server

De [`wettenbank-mcp`](./wettenbank-mcp/) server stelt drie tools beschikbaar voor Claude:

| Tool | Omschrijving |
|------|-------------|
| `wettenbank_zoek` | Naam → BWB-id + metadata (puur SRU-metadata) |
| `wettenbank_artikel` | BWB-id + artikelnummer → artikeltekst met structuurcontext; optioneel `peildatum` |
| `wettenbank_zoekterm` | BWB-id + zoekterm → welke artikelen bevatten de term; wildcard `termijn*` mogelijk |

**Geen API-sleutel nodig.** De server koppelt direct aan de publieke SRU-interface van KOOP; alle data is CC-0.

### Installatie

```bash
cd wettenbank-mcp
npm install
npm run build
```

Voeg toe aan `claude_desktop_config.json` (Claude Desktop) of aan `.claude/settings.json` (Claude Code CLI):

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

---

## Juridisch Analyseschema (JAS)

Wetsartikelen kunnen worden geannoteerd volgens het **Juridisch Analyseschema v1.0.10** (MinBZK, 2024), gebaseerd op de theorie van Wesley Newcomb Hohfeld.

Het JAS maakt interpretatie- en preciseringskeuzes traceerbaar en vormt de basis voor ICT-implementatie van regelgeving.

- **Annotatiekaders**: [`.claude/skills/jas/kaders.md`](./.claude/skills/jas/kaders.md) — alle 13 JAS-elementen met definities en herkenningsvragen
- **Workflow**: [`.claude/skills/jas/SKILL.md`](./.claude/skills/jas/SKILL.md)
- **Rapportformat + checklist**: [`.claude/skills/jas/rapportformat.md`](./.claude/skills/jas/rapportformat.md)
- **Voorbeeldannotaties**: zie [`analyses/`](./analyses/)

---

## Licentie

- Broncode (`wettenbank-mcp`): MIT
- Wetgevingsdata: [CC-0](https://creativecommons.org/publicdomain/zero/1.0/) via KOOP / wetten.overheid.nl
- JAS-kaders: [CC-0](https://regels.overheid.nl/standaarden/wetsanalyse/v1.0.10) via MinBZK
