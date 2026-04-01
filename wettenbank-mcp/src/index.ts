#!/usr/bin/env node
/**
 * Wettenbank MCP Server
 * Koppelt Claude Desktop aan wetten.overheid.nl via de publieke SRU-interface
 * Tools: wettenbank_zoek | wettenbank_ophalen | wettenbank_wijzigingen
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { XMLParser } from "fast-xml-parser";
import { fileURLToPath } from "node:url";

const SRU_BASE = "https://zoekservice.overheid.nl/sru/Search";
const REPO_BASE = "https://repository.officiele-overheidspublicaties.nl/bwb";

// Bekende BWB-ids van kernwetten invordering — gebruikt in fout- en helpberichten
const KERNWET_IDS = `IW 1990 → \`BWBR0004770\` | AWR → \`BWBR0002320\` | Awb → \`BWBR0005537\``;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["record"].includes(name),
});

export async function sruRequest(query: string, maxRecords = 10): Promise<string> {
  const params = new URLSearchParams({
    operation: "searchRetrieve",
    version: "2.0",
    "x-connection": "BWB",
    query,
    maximumRecords: String(maxRecords),
  });
  const res = await fetch(`${SRU_BASE}?${params}`, { headers: { Accept: "application/xml" } });
  if (!res.ok) throw new Error(`SRU HTTP ${res.status}`);
  return res.text();
}

export interface Regeling {
  bwbId: string;
  titel: string;
  type: string;
  ministerie: string;
  rechtsgebied: string;
  geldigVanaf: string;
  geldigTot: string;
  gewijzigd: string;
  repositoryUrl: string;
}

export function parseRecords(xml: string): Regeling[] {
  const parsed = parser.parse(xml);
  const root = parsed?.["searchRetrieveResponse"] ?? {};
  const records: unknown[] = root?.["records"]?.["record"] ?? [];
  const recordsArray = Array.isArray(records) ? records : (records ? [records] : []);

  return recordsArray.map((rec: unknown) => {
    const r = rec as Record<string, unknown>;
    const gzd = (r?.["recordData"] as Record<string, unknown>)?.["gzd"] as Record<string, unknown> ?? {};
    const original = (gzd?.["originalData"] as Record<string, unknown>) ?? {};
    const meta = (original?.["overheidbwb:meta"] as Record<string, unknown>) ?? {};
    const owmskern = (meta?.["owmskern"] as Record<string, unknown>) ?? {};
    const bwbipm = (meta?.["bwbipm"] as Record<string, unknown>) ?? {};
    const enrich = (gzd?.["enrichedData"] as Record<string, unknown>) ?? {};

    const bwbId = String(owmskern?.["dcterms:identifier"] ?? "");
    const rechtsgebied = bwbipm?.["overheidbwb:rechtsgebied"];
    const rechtsgebiedStr = Array.isArray(rechtsgebied)
      ? rechtsgebied.join(", ")
      : String(rechtsgebied ?? "");

    return {
      bwbId,
      titel: String(owmskern?.["dcterms:title"] ?? ""),
      type: String(owmskern?.["dcterms:type"] ?? ""),
      ministerie: String(owmskern?.["overheid:authority"] ?? ""),
      rechtsgebied: rechtsgebiedStr,
      geldigVanaf: String(bwbipm?.["overheidbwb:geldigheidsperiode_startdatum"] ?? ""),
      geldigTot: String(bwbipm?.["overheidbwb:geldigheidsperiode_einddatum"] ?? "onbepaald"),
      gewijzigd: String(owmskern?.["dcterms:modified"] ?? ""),
      repositoryUrl: String(enrich?.["overheidbwb:locatie_toestand"] ?? `${REPO_BASE}/${bwbId}/`),
    };
  });
}

/**
 * Dedupliceert regelingen op BWB-id: behoudt per id alleen de versie met de
 * meest recente geldigVanaf-datum. Voorkomt dat historische versies van
 * dezelfde wet de resultaten overspoelen.
 */
export function dedupliceerOpBwbId(lijst: Regeling[]): Regeling[] {
  const map = new Map<string, Regeling>();
  for (const r of lijst) {
    const bestaande = map.get(r.bwbId);
    if (!bestaande || r.geldigVanaf > bestaande.geldigVanaf) {
      map.set(r.bwbId, r);
    }
  }
  return Array.from(map.values());
}

export function formatRegelingen(lijst: Regeling[]): string {
  if (!lijst.length) return "Geen regelingen gevonden.";
  return lijst
    .map(
      (r, i) =>
        `${i + 1}. **${r.titel || r.bwbId}**\n` +
        `   BWB-id: \`${r.bwbId}\` | Type: ${r.type}\n` +
        `   Ministerie: ${r.ministerie} | Rechtsgebied: ${r.rechtsgebied}\n` +
        `   Geldig: ${r.geldigVanaf} – ${r.geldigTot} | Gewijzigd: ${r.gewijzigd}\n` +
        `   URL: ${r.repositoryUrl}`
    )
    .join("\n\n");
}

export function stripXml(xml: string): string {
  return xml
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 50000);
}

/**
 * Zoekt het dichtstbijzijnde "Artikel X" vóór een matchpositie in de tekst.
 * Geeft de artikelkop terug (bijv. "Artikel 9") of een lege string als niet gevonden.
 */
export function vindArtikelContext(tekst: string, matchIndex: number): string {
  const artikelRegex = /Artikel\s+\d+[a-z]*/gi;
  let dichtbijste = "";
  let dichtbijsteAfstand = Infinity;
  for (const m of tekst.matchAll(artikelRegex)) {
    if (m.index !== undefined && m.index <= matchIndex) {
      const afstand = matchIndex - m.index;
      if (afstand < dichtbijsteAfstand) {
        dichtbijsteAfstand = afstand;
        dichtbijste = m[0];
      }
    }
  }
  return dichtbijste;
}

export async function haalWetstekstOp(
  bwbId: string,
  peildatum?: string
): Promise<{ formatted: string; inhoud: string }> {
  const datum = peildatum ?? new Date().toISOString().slice(0, 10);
  const xml = await sruRequest(`dcterms.identifier==${bwbId} and overheidbwb.geldigheidsdatum==${datum}`, 1);
  const lijst = parseRecords(xml);
  if (!lijst.length) {
    throw new Error(
      `Geen regeling voor BWB-id: ${bwbId}. ` +
      `Gebruik wettenbank_zoek(titel=..., regelingsoort="wet") om het juiste BWB-id te vinden. ` +
      `Bekende ids: ${KERNWET_IDS}.`
    );
  }
  const r = lijst[0];

  let inhoud = "";
  try {
    const resp = await fetch(r.repositoryUrl);
    if (resp.ok) inhoud = stripXml(await resp.text());
    else inhoud = `(Wetstekst niet bereikbaar: ${resp.status})`;
  } catch {
    inhoud = "(Fout bij ophalen wetstekst)";
  }

  const formatted = [
    `# ${r.titel}`,
    `**BWB-id:** ${r.bwbId} | **Type:** ${r.type}`,
    `**Ministerie:** ${r.ministerie} | **Rechtsgebied:** ${r.rechtsgebied}`,
    `**Geldig:** ${r.geldigVanaf} – ${r.geldigTot} | **Gewijzigd:** ${r.gewijzigd}`,
    `**Bron:** ${r.repositoryUrl}`,
    "",
    "---",
    "",
    inhoud || "(Geen wetstekst beschikbaar)",
  ].join("\n");

  return { formatted, inhoud: inhoud || "" };
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = new Server(
  { name: "wettenbank-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "wettenbank_zoek",
      description:
        "Zoek Nederlandse regelingen in het Basiswettenbestand (wetten.overheid.nl) op naam. " +
        "Gebruik 'titel' om wetten op te zoeken (bijv. 'Invorderingswet'). " +
        "Gebruik 'titel' + 'trefwoord' samen om een begrip in de volledige wetstekst van die wet te zoeken. " +
        "LET OP: 'trefwoord' zonder 'titel' doorzoekt alleen regelingmetadata — juridische begrippen worden " +
        "hiermee NIET gevonden. Voor in-tekst zoeken in een bekende wet: gebruik wettenbank_ophalen met zoekterm. " +
        "Filter op rechtsgebied (belastingrecht, bestuursrecht, arbeidsrecht), ministerie of regelingsoort.",
      inputSchema: {
        type: "object",
        properties: {
          titel: { type: "string", description: "Zoekterm in de titel, bijv. 'Invorderingswet'" },
          trefwoord: {
            type: "string",
            description:
              "Gecombineerd met 'titel': zoekt het begrip in de volledige wetstekst. " +
              "Alleen 'trefwoord' (zonder titel) doorzoekt metadata en levert zelden resultaten voor juridische begrippen.",
          },
          rechtsgebied: { type: "string", description: "bijv. belastingrecht, arbeidsrecht" },
          ministerie: { type: "string", description: "bijv. Financiën, Justitie" },
          regelingsoort: {
            type: "string",
            enum: ["wet", "AMvB", "ministeriele-regeling", "regeling", "besluit"],
          },
          maxResultaten: { type: "number", default: 10 },
        },
      },
    },
    {
      name: "wettenbank_ophalen",
      description:
        "Haal de volledige, actuele wetstekst op via BWB-id. " +
        "Kernwet-ids: IW 1990 → BWBR0004770 | AWR → BWBR0002320 | Awb → BWBR0005537. " +
        "Optioneel: peildatum (YYYY-MM-DD) voor een historische versie. " +
        "Optioneel: zoekterm om een begrip in de wetstekst te zoeken — toont vindplaatsen met artikelcontext. " +
        "Dit is de juiste tool voor vragen als 'welke artikelen gaan over termijnen in de IW 1990?'",
      inputSchema: {
        type: "object",
        required: ["bwbId"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770 (IW 1990)" },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD voor historische versie" },
          zoekterm: {
            type: "string",
            description: "Zoek dit begrip in de wetstekst en toon vindplaatsen met artikelcontext",
          },
        },
      },
    },
    {
      name: "wettenbank_wijzigingen",
      description:
        "Haal gewijzigde regelingen op sinds een datum. Filter optioneel op rechtsgebied of ministerie. " +
        "Ideaal voor delta-monitoring van belastingwetgeving.",
      inputSchema: {
        type: "object",
        required: ["sindsdatum"],
        properties: {
          sindsdatum: { type: "string", description: "Startdatum YYYY-MM-DD, bijv. 2024-01-01" },
          rechtsgebied: { type: "string", description: "bijv. belastingrecht" },
          ministerie: { type: "string", description: "bijv. Financiën" },
          maxResultaten: { type: "number", default: 20 },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "wettenbank_zoek") {
      const { titel, trefwoord, rechtsgebied, ministerie, regelingsoort, maxResultaten = 10 } =
        args as Record<string, string | number>;

      // Twee-staps zoeken: wet zoeken op titel, dan trefwoord in de wetstekst
      if (titel && trefwoord) {
        const vandaag = new Date().toISOString().slice(0, 10);
        const titelDelen: string[] = [
          `overheidbwb.titel any "${titel}"`,
          `overheidbwb.geldigheidsdatum==${vandaag}`,
        ];
        if (rechtsgebied) titelDelen.push(`overheidbwb.rechtsgebied == "${rechtsgebied}"`);
        if (ministerie) titelDelen.push(`overheid.authority == "${ministerie}"`);
        if (regelingsoort) titelDelen.push(`dcterms.type == "${regelingsoort}"`);

        const xml = await sruRequest(titelDelen.join(" and "), 5);
        const ruw = parseRecords(xml);
        const lijst = dedupliceerOpBwbId(ruw);

        if (!lijst.length)
          return { content: [{ type: "text", text: `Geen wet gevonden met titel "${titel}".` }] };

        const escapedTerm = String(trefwoord).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const resultaten: string[] = [];
        for (const r of lijst.slice(0, 2)) {
          try {
            const resp = await fetch(r.repositoryUrl);
            if (!resp.ok) {
              resultaten.push(`### ${r.titel}\nBWB-id: \`${r.bwbId}\`\n(Tekst niet bereikbaar: ${resp.status})`);
              continue;
            }
            const tekst = stripXml(await resp.text());
            const matches = Array.from(tekst.matchAll(new RegExp(`.{0,100}${escapedTerm}.{0,100}`, "gi")));
            const aantalLabel = matches.length ? `**${matches.length}x** gevonden` : "**niet gevonden**";
            const fragmenten = matches.slice(0, 10).map(m => {
              const artikel = vindArtikelContext(tekst, m.index!);
              const prefix = artikel ? `**[${artikel}]** ` : "";
              return `> ${prefix}…${m[0].trim()}…`;
            }).join("\n\n");
            resultaten.push(
              `### ${r.titel}\nBWB-id: \`${r.bwbId}\` | "${trefwoord}" ${aantalLabel}\n\n${fragmenten || ""}`
            );
          } catch {
            resultaten.push(`### ${r.titel}\nBWB-id: \`${r.bwbId}\`\n(Fout bij ophalen tekst)`);
          }
        }
        return { content: [{ type: "text", text: resultaten.join("\n\n---\n\n") }] };
      }

      // Trefwoord zonder titel: metadata-zoeken met expliciete waarschuwing
      const metaWaarschuwing = trefwoord && !titel
        ? `> **Let op — metadata-zoeken:** \`trefwoord\` zonder \`titel\` doorzoekt regelingmetadata, ` +
          `niet de wetstekst. Juridische begrippen als "${trefwoord}" worden hiermee zelden gevonden.\n` +
          `> Voor in-tekst zoeken: gebruik \`wettenbank_ophalen\` met \`zoekterm\`.\n` +
          `> ${KERNWET_IDS}\n\n`
        : "";

      const delen: string[] = [];
      if (titel) delen.push(`overheidbwb.titel any "${titel}"`);
      if (trefwoord) delen.push(`cql.anywhere any "${trefwoord}"`);
      if (rechtsgebied) delen.push(`overheidbwb.rechtsgebied == "${rechtsgebied}"`);
      if (ministerie) delen.push(`overheid.authority == "${ministerie}"`);
      if (regelingsoort) delen.push(`dcterms.type == "${regelingsoort}"`);
      if (!delen.length)
        return { content: [{ type: "text", text: "Geef minimaal één zoekcriterium op." }] };

      const query = delen.join(" and ");
      const xml = await sruRequest(query, Math.min(Number(maxResultaten), 50));
      const ruw = parseRecords(xml);
      const lijst = dedupliceerOpBwbId(ruw);
      const gedepliceerd = ruw.length !== lijst.length
        ? ` *(${ruw.length - lijst.length} historische versie(s) weggelaten)*`
        : "";

      return {
        content: [{
          type: "text",
          text: `${metaWaarschuwing}## Resultaten (${lijst.length})${gedepliceerd}\nQuery: \`${query}\`\n\n${formatRegelingen(lijst)}`,
        }],
      };
    }

    if (name === "wettenbank_ophalen") {
      const { bwbId, peildatum, zoekterm } = args as Record<string, string>;
      const { formatted, inhoud } = await haalWetstekstOp(bwbId, peildatum);
      if (zoekterm) {
        const escaped = zoekterm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const matches = Array.from(inhoud.matchAll(new RegExp(`.{0,150}${escaped}.{0,150}`, "gi")));
        const samenvatting = matches.length
          ? `"${zoekterm}" komt **${matches.length}x** voor:\n\n` +
            matches.slice(0, 10).map(m => {
              const artikel = vindArtikelContext(inhoud, m.index!);
              const prefix = artikel ? `**[${artikel}]** ` : "";
              return `> ${prefix}…${m[0].trim()}…`;
            }).join("\n\n")
          : `"${zoekterm}" **niet gevonden** in deze wet.`;
        return {
          content: [{
            type: "text",
            text: `${formatted}\n\n---\n\n## Zoekresultaten: "${zoekterm}"\n\n${samenvatting}`,
          }],
        };
      }
      return { content: [{ type: "text", text: formatted }] };
    }

    if (name === "wettenbank_wijzigingen") {
      const { sindsdatum, rechtsgebied, ministerie, maxResultaten = 20 } =
        args as Record<string, string | number>;
      const delen = [`dcterms.modified >= ${sindsdatum}`];
      if (rechtsgebied) delen.push(`overheidbwb.rechtsgebied == "${rechtsgebied}"`);
      if (ministerie) delen.push(`overheid.authority == "${ministerie}"`);
      const query = delen.join(" and ");
      const xml = await sruRequest(query, Math.min(Number(maxResultaten), 50));
      const lijst = dedupliceerOpBwbId(
        parseRecords(xml).sort((a, b) => b.gewijzigd.localeCompare(a.gewijzigd))
      );
      return {
        content: [{
          type: "text",
          text: `## Wijzigingen sinds ${sindsdatum} (${lijst.length})\n\n${formatRegelingen(lijst)}`,
        }],
      };
    }

    return { content: [{ type: "text", text: `Onbekende tool: ${name}` }], isError: true };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Fout: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

// Alleen starten als direct uitgevoerd (niet bij import in tests)
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Wettenbank MCP server gestart.");
}
