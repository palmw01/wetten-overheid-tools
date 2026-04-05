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

interface ArtikelMatch {
  type: "artikel" | "circulaire.divisie";
  node: Record<string, unknown>;
}

// Zoekt recursief een artikel-node op basis van artikelnummer.
// Structurele containers (wettekst, hoofdstuk, paragraaf, …) worden doorzocht;
// artikel en circulaire.divisie worden gecontroleerd én doorzocht (voor geneste artikelen).
function zoekArtikelInDom(
  node: Record<string, unknown>,
  artikelnummer: string,
  depth = 0
): ArtikelMatch | null {
  // Voorkom stack overflow bij extreem geneste of malformed XML
  if (depth > 30) return null;
  for (const key of ["artikel", "circulaire.divisie"] as const) {
    const items = node[key] as Record<string, unknown>[] | undefined;
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const kop = item.kop as Record<string, unknown> | undefined;
      if (kop && getNrValue(kop.nr) === artikelnummer) {
        return { type: key, node: item };
      }
      const found = zoekArtikelInDom(item, artikelnummer, depth + 1);
      if (found) return found;
    }
  }
  // Structurele containers (XSD: boek, deel, hoofdstuk, afdeling, paragraaf + wettekst-pad)
  for (const key of [
    "boek", "deel", "hoofdstuk", "afdeling", "paragraaf",
    "wettekst", "wet-besluit", "wetgeving", "circulaire", "tekst",
  ]) {
    const val = node[key];
    if (!val) continue;
    const list = Array.isArray(val)
      ? (val as Record<string, unknown>[])
      : [val as Record<string, unknown>];
    for (const child of list) {
      const found = zoekArtikelInDom(child, artikelnummer, depth + 1);
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
  const { node } = match;
  const kop = node.kop as Record<string, unknown> | undefined;
  const nr = kop ? getNrValue(kop.nr) : "";
  const titel = kop?.titel != null ? stripXml(String(kop.titel)) : "";
  const parts: string[] = [titel ? `Artikel ${nr} ${titel}` : `Artikel ${nr}`];

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

// ── Hulpfuncties tool-handlers ───────────────────────────────────────────────

// Formatteert een lijst van regex-matches als geciteerde fragmenten met artikelcontext.
// Pre-bouwt artikel-posities eenmalig (O(n)) zodat elke lookup O(k) is over het
// artikel-posities-array in plaats van O(n) over de volledige tekst per match.
function formatFragmenten(
  matches: RegExpMatchArray[],
  tekst: string,
  maxAantal = 10
): string {
  const artikelPos = [...tekst.matchAll(/Artikel\s+\d+[a-z]*/gi)]
    .map(m => ({ index: m.index!, tekst: m[0] }));
  return matches.slice(0, maxAantal).map(m => {
    let ctx = "";
    for (const ap of artikelPos) {
      if (ap.index > m.index!) break;
      ctx = ap.tekst;
    }
    const prefix = ctx ? `**[${ctx}]** ` : "";
    return `> ${prefix}…${m[0].trim()}…`;
  }).join("\n\n");
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
        "Kernwet-ids: IW 1990 → BWBR0004770 | AWR → BWBR0005537 | Leidraad 2008 → BWBR0024096. " +
        "Optioneel: peildatum (YYYY-MM-DD) voor een historische versie. " +
        "Optioneel: artikel om één specifiek artikel op te halen, bijv. '3:40' of '25' — werkt ook voor grote wetten zoals de Awb. " +
        "Optioneel: zoekterm om een begrip in de wetstekst te zoeken — toont vindplaatsen met artikelcontext. " +
        "Dit is de juiste tool voor vragen als 'welke artikelen gaan over termijnen in de IW 1990?'",
      inputSchema: {
        type: "object",
        required: ["bwbId"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770 (IW 1990)" },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD voor historische versie" },
          artikel: {
            type: "string",
            description: "Artikelnummer om direct op te halen, bijv. '3:40' (Awb) of '25' (IW 1990). Geeft alleen dit artikel terug — efficiënter dan de volledige wet.",
          },
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
        const titelDelen: string[] = [
          `overheidbwb.titel any "${titel}"`,
          `overheidbwb.geldigheidsdatum==${vandaag()}`,
        ];
        if (rechtsgebied) titelDelen.push(`overheidbwb.rechtsgebied == "${rechtsgebied}"`);
        if (ministerie) titelDelen.push(`overheid.authority == "${ministerie}"`);
        if (regelingsoort) titelDelen.push(`dcterms.type == "${regelingsoort}"`);

        const xml = await sruRequest(titelDelen.join(" and "), 5);
        const ruw = parseRecords(xml);
        const lijst = dedupliceerOpBwbId(ruw);

        if (!lijst.length)
          return { content: [{ type: "text", text: `Geen wet gevonden met titel "${titel}".` }] };

        const escapedTerm = escapeerRegex(String(trefwoord));
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
            const fragmenten = formatFragmenten(matches, tekst);
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
      const { bwbId, peildatum, artikel, zoekterm } = args as Record<string, string>;
      const { formatted, inhoud, rawXml } = await haalWetstekstOp(bwbId, peildatum);

      const header = formatted.split("\n---\n")[0];

      // Artikel-extractie: haal één specifiek artikel op
      if (artikel) {
        // Probeer eerst XML-gebaseerde extractie (betrouwbaarder: geen valse splits op kruisverwijzingen)
        const artikelTekst = (rawXml ? extraheerArtikelUitXml(rawXml, artikel) : null) ?? extraheerArtikel(inhoud, artikel);
        if (artikelTekst) {
          return {
            content: [{
              type: "text",
              text: `${header}\n\n---\n\n${artikelTekst}`,
            }],
          };
        }
        return {
          content: [{
            type: "text",
            text: `${header}\n\n---\n\nArtikel ${artikel} niet gevonden in deze wet.`,
          }],
        };
      }

      // Zoekterm: toon vindplaatsen met context
      if (zoekterm) {
        const escaped = escapeerRegex(zoekterm);
        const matches = Array.from(inhoud.matchAll(new RegExp(`.{0,150}${escaped}.{0,150}`, "gi")));
        const samenvatting = matches.length
          ? `"${zoekterm}" komt **${matches.length}x** voor:\n\n${formatFragmenten(matches, inhoud)}`
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
