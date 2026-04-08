#!/usr/bin/env node
/**
 * Wettenbank MCP Server
 * Koppelt Claude Desktop aan wetten.overheid.nl via de publieke SRU-interface
 * Tools: wettenbank_zoek | wettenbank_artikel | wettenbank_zoekterm
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
const KERNWET_IDS = `IW 1990 → \`BWBR0004770\` | AWR → \`BWBR0002320\` | Awb → \`BWBR0005537\` | Leidraad 2008 → \`BWBR0024096\``;

function vandaag(): string {
  return new Date().toISOString().slice(0, 10);
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => ["record"].includes(name),
});

// Parser voor BWB-toestand XML (wetgeving-documenten)
// isArray gebaseerd op XSD toestand_base_2016-1.xsd (maxOccurs="unbounded")
// stopNodes: al is mixed content (tekst + inline markup zoals intref, extref, nadruk)
const wetParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) =>
    [
      "artikel", "lid", "li", "circulaire.divisie",
      "paragraaf", "afdeling", "hoofdstuk", "boek", "deel",
      "bwb-wijziging", "jci", "row", "tgroup",
    ].includes(name),
  stopNodes: ["*.al"],
  trimValues: true,
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

export function escapeerRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function bouwTermPatroon(zoekterm: string): string {
  if (zoekterm.endsWith("*")) {
    return escapeerRegex(zoekterm.slice(0, -1)) + "\\w*";
  }
  return escapeerRegex(zoekterm);
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
    .trim();
}

// ── Artikel-extractie via DOM (BWB-toestand XSD) ────────────────────────────

// Extraheert de tekstwaarde van een <nr>-element.
// fast-xml-parser levert: integer (25), float (24.1), string ("3:40", "22bis"),
// of object met #text wanneer nr ook attributen heeft (bijv. status="officieel").
function getNrValue(nr: unknown): string {
  if (typeof nr === "number") return String(nr);
  if (typeof nr === "string") return nr.trim();
  if (typeof nr === "object" && nr !== null) {
    const t = (nr as Record<string, unknown>)["#text"];
    if (t != null) return String(t).trim();
  }
  return "";
}

interface ArtikelContext {
  type: string; // "hoofdstuk" | "afdeling" | "paragraaf" | "deel" | "boek"
  nr: string;
  titel: string;
}

interface ArtikelMatch {
  type: "artikel" | "circulaire.divisie";
  node: Record<string, unknown>;
  context: ArtikelContext[]; // ancestor-keten, buitenste eerst
}

// Zoekt recursief een artikel-node op basis van artikelnummer.
// Structurele containers (wettekst, hoofdstuk, paragraaf, …) worden doorzocht;
// artikel en circulaire.divisie worden gecontroleerd én doorzocht (voor geneste artikelen).
// Ancestor-keten wordt opgebouwd voor containers met een kop (nr/titel).
function zoekArtikelInDom(
  node: Record<string, unknown>,
  artikelnummer: string,
  depth = 0,
  ancestors: ArtikelContext[] = []
): ArtikelMatch | null {
  // Voorkom stack overflow bij extreem geneste of malformed XML
  if (depth > 30) return null;
  for (const key of ["artikel", "circulaire.divisie"] as const) {
    const items = node[key] as Record<string, unknown>[] | undefined;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const kop = item.kop as Record<string, unknown> | undefined;
      if (kop && getNrValue(kop.nr) === artikelnummer) {
        return { type: key, node: item, context: ancestors };
      }
      const found = zoekArtikelInDom(item, artikelnummer, depth + 1, ancestors);
      if (found) return found;
    }
  }
  // Structurele containers met ancestor-tracking voor nodes met kop
  const structuurContainers = ["boek", "deel", "hoofdstuk", "afdeling", "paragraaf"] as const;
  const overigeContainers = ["wettekst", "wet-besluit", "wetgeving", "circulaire", "tekst"] as const;
  for (const key of [...structuurContainers, ...overigeContainers]) {
    const val = node[key];
    if (!val) continue;
    const list = Array.isArray(val)
      ? (val as Record<string, unknown>[])
      : [val as Record<string, unknown>];
    for (const child of list) {
      let childAncestors = ancestors;
      if ((structuurContainers as readonly string[]).includes(key)) {
        const kop = child.kop as Record<string, unknown> | undefined;
        if (kop) {
          const nr = getNrValue(kop.nr);
          const titel = getNrValue(kop.titel); // getNrValue handles {#text, @_status} objects
          if (nr || titel) {
            childAncestors = [...ancestors, { type: key, nr, titel }];
          }
        }
      }
      const found = zoekArtikelInDom(child, artikelnummer, depth + 1, childAncestors);
      if (found) return found;
    }
  }
  return null;
}

function formatLijst(lijst: Record<string, unknown>): string[] {
  const items = Array.isArray(lijst.li) ? lijst.li : (lijst.li ? [lijst.li] : []);
  return (items as Record<string, unknown>[]).map((li) => {
    const linr = li["li.nr"] != null ? String(li["li.nr"]) : "";
    const al = li.al != null ? stripXml(String(li.al)) : "";
    return `  ${linr} ${al}`.trimEnd();
  });
}

function formateerArtikelNode(match: ArtikelMatch): string {
  const { node, context } = match;
  const kop = node.kop as Record<string, unknown> | undefined;
  const nr = kop ? getNrValue(kop.nr) : "";
  const titel = kop?.titel != null ? getNrValue(kop.titel) : "";
  const parts: string[] = [];
  if (context.length > 0) {
    const prefix = context
      .map(c => {
        const label = c.type.charAt(0).toUpperCase() + c.type.slice(1);
        const nr = c.nr ? ` ${c.nr}` : "";
        const titel = c.titel ? ` — ${c.titel}` : "";
        return `${label}${nr}${titel}`;
      })
      .join(" > ");
    parts.push(`[Structuur: ${prefix}]`);
    parts.push("");
  }
  parts.push(titel ? `Artikel ${nr} ${titel}` : `Artikel ${nr}`);

  // Directe <al> (artikel zonder lid, of preamble-tekst boven lid-lijst)
  if (node.al != null) {
    const als = Array.isArray(node.al) ? node.al : [node.al];
    for (const al of als) parts.push(stripXml(String(al)));
  }

  // <lijst> direct in artikel zonder lid (XSD: structuur.maximaal in artikel)
  if (node.lijst && !node.lid) {
    const lijsten = Array.isArray(node.lijst) ? node.lijst : [node.lijst];
    for (const l of lijsten as Record<string, unknown>[]) parts.push(...formatLijst(l));
  }

  // <lid> elementen (XSD: class.lid — bevat lidnr + structuur.maximaal*)
  if (Array.isArray(node.lid)) {
    for (const lid of node.lid as Record<string, unknown>[]) {
      const lidnr = lid.lidnr != null ? stripXml(String(lid.lidnr)) : "";
      const prefix = lidnr ? `${lidnr} ` : "";
      if (lid.al != null) parts.push(prefix + stripXml(String(lid.al)));
      if (lid.lijst) {
        const lijsten = Array.isArray(lid.lijst) ? lid.lijst : [lid.lijst];
        for (const l of lijsten as Record<string, unknown>[]) parts.push(...formatLijst(l));
      }
    }
  }

  // <tekst> blok (XSD: class.circulaire-tekst — hoofdtekst van circulaire.divisie)
  if (node.tekst) {
    const tekst = node.tekst as Record<string, unknown>;
    const als = Array.isArray(tekst.al) ? tekst.al : (tekst.al ? [tekst.al] : []);
    for (const al of als) parts.push(stripXml(String(al)));
  }

  return parts.join("\n").trim();
}

/**
 * Extraheert één artikel uit de ruwe BWB-toestand XML via DOM-traversal.
 * Gebruikt fast-xml-parser met configuratie afgeleid van toestand_base_2016-1.xsd.
 * Ondersteunt zowel <artikel> (reguliere wetten) als <circulaire.divisie> (Leidraad).
 * Fallback: extraheerArtikel() op de gesripte tekst.
 */
export function extraheerArtikelUitXml(rawXml: string, artikelnummer: string): string | null {
  try {
    const dom = wetParser.parse(rawXml) as Record<string, unknown>;
    const found = zoekArtikelInDom(dom, artikelnummer);
    if (!found) return null;
    return formateerArtikelNode(found);
  } catch {
    return null;
  }
}

/**
 * Extraheert één artikel uit de platte wetstekst op basis van het artikelnummer.
 * Werkt op de output van stripXml(). Ondersteunt zowel "3:40" (Awb) als "25" (IW 1990).
 * Strips ook de trailing publicatiemetadata (datums/nummers).
 * Fallback voor als extraheerArtikelUitXml geen resultaat geeft.
 */
export function extraheerArtikel(tekst: string, artikelnummer: string): string | null {
  const escaped = escapeerRegex(artikelnummer);
  const parts = tekst.split(/(?=Artikel \d)/);
  const match = parts.find(p => new RegExp(`^Artikel ${escaped}[\\s\\t]`).test(p));
  if (!match) return null;
  // Strip trailing publicatiemetadata: reeks jaar/volgnr/datum-patronen
  return match.replace(/\s*\d{4}\s+\d+\s+\d{2}-\d{2}-\d{4}.*$/s, "").trim();
}

/**
 * Zoekt het dichtstbijzijnde "Artikel X" vóór een matchpositie in de tekst.
 * Geeft de artikelkop terug (bijv. "Artikel 9") of een lege string als niet gevonden.
 */
export function vindArtikelContext(tekst: string, matchIndex: number): string {
  const artikelRegex = /Artikel\s+[\d:]+[a-z]*/gi;
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
): Promise<{ formatted: string; inhoud: string; rawXml: string }> {
  const datum = peildatum ?? vandaag();
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

  let rawXml = "";
  let inhoud = "";
  try {
    const resp = await fetch(r.repositoryUrl);
    if (resp.ok) {
      rawXml = await resp.text();
      inhoud = stripXml(rawXml);
    } else {
      inhoud = `(Wetstekst niet bereikbaar: ${resp.status})`;
    }
  } catch {
    inhoud = "(Fout bij ophalen wetstekst)";
  }

  const formatted = [
    `**${r.titel}** (${r.bwbId}) — geldig per ${datum}`,
    "",
    inhoud || "(Geen wetstekst beschikbaar)",
  ].join("\n");

  return { formatted, inhoud: inhoud || "", rawXml };
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
        "Zoek Nederlandse regelingen in het Basiswettenbestand (wetten.overheid.nl) op naam en retourneer BWB-id + metadata. " +
        "Gebruik 'titel' om wetten op te zoeken (bijv. 'Invorderingswet'). " +
        "Filter optioneel op rechtsgebied (belastingrecht, bestuursrecht), ministerie of regelingsoort. " +
        "Kernwet-ids zijn al bekend: IW 1990 → BWBR0004770 | AWR → BWBR0002320 | Awb → BWBR0005537 | Leidraad 2008 → BWBR0024096.",
      inputSchema: {
        type: "object",
        properties: {
          titel: { type: "string", description: "Zoekterm in de titel, bijv. 'Invorderingswet'" },
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
      name: "wettenbank_artikel",
      description:
        "Haal één artikel op uit een Nederlandse wet (één artikel per aanroep). " +
        "Voor meerdere artikelen: roep deze tool parallel aan per artikel. " +
        "Kernwet-ids: IW 1990 → BWBR0004770 | AWR → BWBR0002320 | Awb → BWBR0005537 | Leidraad 2008 → BWBR0024096. " +
        "Optioneel: peildatum (YYYY-MM-DD) voor een historische versie; default is vandaag. " +
        "De response bevat de artikeltekst met structuurprefix ([Structuur: Hoofdstuk X — titel]) wanneer beschikbaar. " +
        "Geeft expliciet aan als het artikel niet gevonden is.",
      inputSchema: {
        type: "object",
        required: ["bwbId", "artikel"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770 (IW 1990)" },
          artikel: {
            type: "string",
            description: "Artikelnummer, bijv. '25' (IW 1990) of '3:40' (Awb).",
          },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD voor historische versie; default is vandaag." },
        },
      },
    },
    {
      name: "wettenbank_zoekterm",
      description:
        "Zoek welke artikelen een begrip bevatten in één Nederlandse wet (één BWB-id per aanroep). " +
        "Voor meerdere wetten: roep deze tool parallel aan per BWB-id. " +
        "Retourneert een lijst van artikelnummers met treffertellingen en directe aanroepvoorbeelden voor wettenbank_artikel. " +
        "Wildcard: 'termijn*' matcht ook 'termijnen', 'termijnoverschrijding' etc. " +
        "Geeft expliciet aan als de term nergens gevonden is. " +
        "Optioneel: peildatum (YYYY-MM-DD) voor een historische versie; default is vandaag.",
      inputSchema: {
        type: "object",
        required: ["bwbId", "zoekterm"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770 (IW 1990)" },
          zoekterm: {
            type: "string",
            description: "Te zoeken begrip. Wildcard mogelijk: 'termijn*' matcht 'termijnen', 'termijnoverschrijding' etc.",
          },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD voor historische versie; default is vandaag." },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "wettenbank_zoek") {
      const { titel, rechtsgebied, ministerie, regelingsoort, maxResultaten = 10 } =
        args as Record<string, string | number>;

      const delen: string[] = [];
      if (titel) delen.push(`overheidbwb.titel any "${titel}"`);
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
          text: `## Resultaten (${lijst.length})${gedepliceerd}\nQuery: \`${query}\`\n\n${formatRegelingen(lijst)}`,
        }],
      };
    }

    if (name === "wettenbank_artikel") {
      const { bwbId, artikel, peildatum } = args as Record<string, string>;
      const { formatted, inhoud, rawXml } = await haalWetstekstOp(bwbId, peildatum);
      const header = formatted.split("\n")[0];
      const artikelTekst = (rawXml ? extraheerArtikelUitXml(rawXml, artikel) : null)
        ?? extraheerArtikel(inhoud, artikel);
      if (artikelTekst) {
        return {
          content: [{ type: "text", text: `${header}\n\n---\n\n${artikelTekst}` }],
        };
      }
      return {
        content: [{ type: "text", text: `${header}\n\n---\n\nArtikel ${artikel} **niet gevonden** in deze wet.` }],
      };
    }

    if (name === "wettenbank_zoekterm") {
      const { bwbId, zoekterm, peildatum } = args as Record<string, string>;
      const { formatted, inhoud } = await haalWetstekstOp(bwbId, peildatum);
      const header = formatted.split("\n")[0];
      const termPatroon = bouwTermPatroon(zoekterm);
      const matches = Array.from(inhoud.matchAll(new RegExp(termPatroon, "gi")));

      if (!matches.length) {
        return {
          content: [{ type: "text", text: `${header}\n\n"${zoekterm}" **niet gevonden** in deze wet.` }],
        };
      }

      const telPerArtikel = new Map<string, number>();
      for (const m of matches) {
        const ctx = vindArtikelContext(inhoud, m.index!);
        const key = ctx || "(buiten artikel)";
        telPerArtikel.set(key, (telPerArtikel.get(key) ?? 0) + 1);
      }

      const regels = [...telPerArtikel.entries()]
        .map(([art, n]) => {
          const nr = art.replace(/^Artikel\s+/i, "");
          return `- ${art} — ${n}x  →  \`wettenbank_artikel(bwbId="${bwbId}", artikel="${nr}")\``;
        })
        .join("\n");

      return {
        content: [{
          type: "text",
          text: `${header}\n\n## Zoekresultaten: "${zoekterm}" (${matches.length}x in ${telPerArtikel.size} artikel(en))\n\n${regels}`,
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
