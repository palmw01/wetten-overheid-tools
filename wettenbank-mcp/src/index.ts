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
export const wetParser = new XMLParser({
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

export function bouwJciUri(bwbId: string, artikel: string, lid?: string): string {
  const base = `jci1.3:c:${bwbId}&artikel=${artikel}`;
  return lid ? `${base}&lid=${lid}` : base;
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

/**
 * Verwerkt raw `<al>`-content naar Markdown.
 * Zet inline markup om vóór stripXml: extref→link, intref→cursief, nadruk→vet/cursief.
 * Resterende onbekende tags worden door stripXml verwijderd.
 */
export function renderAl(raw: string): string {
  let result = String(raw);
  // <extref doc="BWBR...">tekst</extref>  →  [tekst](BWBR...)
  result = result.replace(
    /<extref[^>]*\bdoc="([^"]+)"[^>]*>([\s\S]*?)<\/extref>/g,
    (_, doc, inner) => `[${stripXml(inner)}](${doc})`
  );
  // <intref>tekst</intref>  →  *tekst*  (interne verwijzing, geen URL)
  result = result.replace(
    /<intref[^>]*>([\s\S]*?)<\/intref>/g,
    (_, inner) => `*${stripXml(inner)}*`
  );
  // <nadruk type="vet">  →  **vet**
  result = result.replace(
    /<nadruk[^>]*\btype="vet"[^>]*>([\s\S]*?)<\/nadruk>/g,
    (_, inner) => `**${stripXml(inner)}**`
  );
  // <nadruk type="cur">  →  _cursief_
  result = result.replace(
    /<nadruk[^>]*\btype="cur"[^>]*>([\s\S]*?)<\/nadruk>/g,
    (_, inner) => `_${stripXml(inner)}_`
  );
  return stripXml(result);
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

/**
 * Extraheert de tekstinhoud van een <al>-element.
 * fast-xml-parser levert voor stopNodes normaal een string (de rauwe inner-XML),
 * maar als <al> attributen heeft (bijv. status="...") dan een object { "#text": "...", "@_attr": "..." }.
 * String(object) geeft dan "[object Object]" — deze helper voorkomt dat.
 */
export function getAlText(al: unknown): string {
  if (typeof al === "string") return al;
  if (typeof al === "number") return String(al);
  if (typeof al === "object" && al !== null) {
    const obj = al as Record<string, unknown>;
    const text = obj["#text"];
    if (text != null) return String(text);
  }
  return "";
}

/**
 * Splitst een artikelparameter in artikelnummer en optioneel lidnummer.
 * "9.1" → { artikelnr: "9", lidnr: "1" }
 * "25"  → { artikelnr: "25", lidnr: null }
 * "3:40" → { artikelnr: "3:40", lidnr: null }  (geen punt → geen lid)
 * "25.1" → { artikelnr: "25", lidnr: "1" }
 * Opmerking: Leidraad sub-artikelen ("25.1") worden eerst direct opgezocht;
 * pas als dat mislukt wordt de lid-interpretatie geprobeerd (zie wettenbank_artikel-handler).
 */
export function parseerArtikelParam(artikel: string): { artikelnr: string; lidnr: string | null } {
  const dotIdx = artikel.lastIndexOf(".");
  if (dotIdx > 0) {
    const maybeArtikel = artikel.slice(0, dotIdx);
    const maybeLid = artikel.slice(dotIdx + 1);
    if (/^\d+$/.test(maybeLid) && maybeArtikel.length > 0) {
      return { artikelnr: maybeArtikel, lidnr: maybeLid };
    }
  }
  return { artikelnr: artikel, lidnr: null };
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
  const overigeContainers = ["toestand", "wettekst", "wet-besluit", "wetgeving", "circulaire", "tekst"] as const;
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

function formatLijst(lijst: Record<string, unknown>, diepte = 0): string[] {
  const indent = "   ".repeat(diepte + 1);
  const items = Array.isArray(lijst.li) ? lijst.li : (lijst.li ? [lijst.li] : []);
  const lines: string[] = [];
  for (const li of items as Record<string, unknown>[]) {
    const linr = li["li.nr"] != null ? getNrValue(li["li.nr"]) : "";
    const al = li.al != null ? renderAl(getAlText(li.al)) : "";
    lines.push(`${indent}${linr} ${al}`.trimEnd());
    // Geneste <lijst> binnen <li> (bijv. sub-onderdelen 1°, 2°)
    if (li.lijst) {
      const sublijsten = Array.isArray(li.lijst) ? li.lijst : [li.lijst];
      for (const sub of sublijsten as Record<string, unknown>[]) {
        lines.push(...formatLijst(sub, diepte + 1));
      }
    }
  }
  return lines;
}

function formatLidNode(lid: Record<string, unknown>, parts: string[], artikelnr?: string): void {
  const lidnr = lid.lidnr != null ? getNrValue(lid.lidnr) : "";
  // Gebruik "9.1" notatie wanneer het artikelnummer bekend is, anders "1."
  const prefix = lidnr ? (artikelnr ? `${artikelnr}.${lidnr}  ` : `${lidnr}.  `) : "";
  if (lid.al != null) {
    const als = Array.isArray(lid.al) ? lid.al : [lid.al];
    als.forEach((al, i) => parts.push((i === 0 ? prefix : "      ") + renderAl(getAlText(al))));
  }
  if (lid.lijst) {
    const lijsten = Array.isArray(lid.lijst) ? lid.lijst : [lid.lijst];
    for (const l of lijsten as Record<string, unknown>[]) parts.push(...formatLijst(l));
  }
}

function formateerArtikelNode(match: ArtikelMatch, lidFilter?: string): string {
  const { node, context } = match;
  const kop = node.kop as Record<string, unknown> | undefined;
  const nr = kop ? getNrValue(kop.nr) : "";
  const titel = kop?.titel != null ? getNrValue(kop.titel) : "";
  const parts: string[] = [];
  if (context.length > 0) {
    for (const c of context) {
      const label = c.type.charAt(0).toUpperCase() + c.type.slice(1);
      const nr = c.nr ? ` ${c.nr}` : "";
      const titel = c.titel ? ` — ${c.titel}` : "";
      parts.push(`${label}${nr}${titel}`);
    }
    parts.push("");
  }
  parts.push(titel ? `Artikel ${nr} ${titel}` : `Artikel ${nr}`);

  if (lidFilter) {
    // Toon alleen het gevraagde lid
    if (Array.isArray(node.lid)) {
      const gevondenLid = (node.lid as Record<string, unknown>[]).find(lid => {
        const lidnr = lid.lidnr != null ? getNrValue(lid.lidnr) : "";
        return lidnr === lidFilter;
      });
      if (gevondenLid) {
        formatLidNode(gevondenLid, parts, nr);
      } else {
        parts.push(`(Lid ${lidFilter} niet gevonden in dit artikel)`);
      }
    } else {
      parts.push(`(Dit artikel heeft geen genummerde leden)`);
    }
    return parts.join("\n").trim();
  }

  // Directe <al> (artikel zonder lid, of preamble-tekst boven lid-lijst)
  if (node.al != null) {
    const als = Array.isArray(node.al) ? node.al : [node.al];
    for (const al of als) parts.push(renderAl(getAlText(al)));
  }

  // <lijst> direct in artikel zonder lid (XSD: structuur.maximaal in artikel)
  if (node.lijst && !node.lid) {
    const lijsten = Array.isArray(node.lijst) ? node.lijst : [node.lijst];
    for (const l of lijsten as Record<string, unknown>[]) parts.push(...formatLijst(l));
  }

  // <lid> elementen (XSD: class.lid — bevat lidnr + structuur.maximaal*)
  if (Array.isArray(node.lid)) {
    for (const lid of node.lid as Record<string, unknown>[]) {
      formatLidNode(lid, parts, nr);
    }
  }

  // <tekst> blok (XSD: class.circulaire-tekst — hoofdtekst van circulaire.divisie)
  if (node.tekst) {
    const tekst = node.tekst as Record<string, unknown>;
    const als = Array.isArray(tekst.al) ? tekst.al : (tekst.al ? [tekst.al] : []);
    for (const al of als) parts.push(renderAl(getAlText(al)));
  }

  return parts.join("\n").trim();
}

/**
 * Extraheert één artikel uit de ruwe BWB-toestand XML via DOM-traversal.
 * Gebruikt fast-xml-parser met configuratie afgeleid van toestand_base_2016-1.xsd.
 * Ondersteunt zowel <artikel> (reguliere wetten) als <circulaire.divisie> (Leidraad).
 * Fallback: extraheerArtikel() op de gesripte tekst.
 */
export function extraheerArtikelUitXml(rawXml: string, artikelnummer: string, lidFilter?: string): string | null {
  try {
    const dom = wetParser.parse(rawXml) as Record<string, unknown>;
    const found = zoekArtikelInDom(dom, artikelnummer);
    if (!found) return null;
    return formateerArtikelNode(found, lidFilter);
  } catch {
    return null;
  }
}

/**
 * Controleert de `@_status` van een artikel-node.
 * Geeft een waarschuwingsstring terug als het artikel niet de status "goed" of "geldend" heeft.
 */
export function detecteerArtikelStatus(rawXml: string, artikelnummer: string): string | null {
  if (!rawXml) return null;
  try {
    const dom = wetParser.parse(rawXml) as Record<string, unknown>;
    const found = zoekArtikelInDom(dom, artikelnummer);
    if (!found) return null;
    const status = (found.node["@_status"] as string | undefined) ?? "";
    if (status && status !== "goed" && status !== "geldend") {
      return `Artikel heeft status "${status}"`;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Zoekterm via DOM (wettenbank_zoekterm) ────────────────────────────────────

export interface TermTreffer {
  artikelnummer: string;
  aantalTreffers: number;
  leden: string[];
}

/**
 * Zoekt een term in alle artikel-nodes van de geparsde DOM.
 * Per artikel-node worden alle <al>-teksten doorzocht (binnen lid, lijst, tekst).
 * Geeft een gesorteerde lijst van artikelnummers met het aantal treffers terug.
 * Veel nauwkeuriger dan zoeken in gestripte platte tekst omdat artikel-grenzen
 * uit de XML-structuur komen, niet uit tekstpatronen.
 */
export function zoekTermInArtikelDom(
  dom: Record<string, unknown>,
  patroon: RegExp
): TermTreffer[] {
  const tellers = new Map<string, { count: number; leden: Set<string> }>();

  function tel(nr: string, tekst: string, lidnr?: string): void {
    const m = stripXml(tekst).match(patroon);
    if (m) {
      const entry = tellers.get(nr) ?? { count: 0, leden: new Set<string>() };
      entry.count += m.length;
      if (lidnr != null) entry.leden.add(lidnr);
      tellers.set(nr, entry);
    }
  }

  // Doorzoekt een <lijst>-node recursief (inclusief geneste sub-lijsten).
  function telInLijst(lijst: Record<string, unknown>, nr: string, lidnr?: string): void {
    const items = Array.isArray(lijst.li) ? lijst.li : (lijst.li ? [lijst.li] : []);
    for (const li of items as Record<string, unknown>[]) {
      if (li.al != null) tel(nr, getAlText(li.al), lidnr);
      if (li.lijst) {
        const sublijsten = Array.isArray(li.lijst) ? li.lijst : [li.lijst];
        for (const sub of sublijsten as Record<string, unknown>[]) telInLijst(sub, nr, lidnr);
      }
    }
  }

  function telInArtikelNode(node: Record<string, unknown>, nr: string): void {
    // Directe <al>
    if (node.al != null) {
      const als = Array.isArray(node.al) ? node.al : [node.al];
      for (const al of als) tel(nr, getAlText(al));
    }
    // Directe <lijst> (artikel zonder lid)
    if (node.lijst) {
      const lijsten = Array.isArray(node.lijst) ? node.lijst : [node.lijst];
      for (const lijst of lijsten as Record<string, unknown>[]) telInLijst(lijst, nr);
    }
    // <lid> elementen
    if (Array.isArray(node.lid)) {
      for (const lid of node.lid as Record<string, unknown>[]) {
        const lidnr = lid.lidnr != null ? getNrValue(lid.lidnr) : undefined;
        if (lid.al != null) {
          const als = Array.isArray(lid.al) ? lid.al : [lid.al];
          for (const al of als) tel(nr, getAlText(al), lidnr);
        }
        if (lid.lijst) {
          const lijsten = Array.isArray(lid.lijst) ? lid.lijst : [lid.lijst];
          for (const lijst of lijsten as Record<string, unknown>[]) telInLijst(lijst, nr, lidnr);
        }
      }
    }
    // <tekst> blok (circulaire.divisie)
    if (node.tekst) {
      const tekst = node.tekst as Record<string, unknown>;
      const als = Array.isArray(tekst.al) ? tekst.al : (tekst.al ? [tekst.al] : []);
      for (const al of als) tel(nr, getAlText(al));
    }
  }

  function traverseer(node: Record<string, unknown>, depth = 0): void {
    if (depth > 30) return;
    for (const key of ["artikel", "circulaire.divisie"] as const) {
      const items = node[key] as Record<string, unknown>[] | undefined;
      if (!Array.isArray(items)) continue;
      for (const item of items) {
        const kop = item.kop as Record<string, unknown> | undefined;
        const nr = kop ? getNrValue(kop.nr) : "";
        if (nr) telInArtikelNode(item, nr);
        traverseer(item, depth + 1);
      }
    }
    for (const key of ["toestand", "boek", "deel", "hoofdstuk", "afdeling", "paragraaf",
                       "wettekst", "wet-besluit", "wetgeving", "circulaire", "tekst"] as const) {
      const val = (node as Record<string, unknown>)[key];
      if (!val) continue;
      const list = Array.isArray(val) ? val as Record<string, unknown>[] : [val as Record<string, unknown>];
      for (const child of list) traverseer(child, depth + 1);
    }
  }

  traverseer(dom);
  return Array.from(tellers.entries())
    .map(([artikelnummer, { count, leden }]) => ({
      artikelnummer,
      aantalTreffers: count,
      leden: Array.from(leden).sort((a, b) => parseFloat(a) - parseFloat(b)),
    }))
    .sort((a, b) => {
      const nA = parseFloat(a.artikelnummer), nB = parseFloat(b.artikelnummer);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      return a.artikelnummer.localeCompare(b.artikelnummer);
    });
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

export interface DocMetadata {
  citeertitel: string;
  versiedatum: string;
}

/**
 * Haalt `citeertitel` en `inwerkingtredingsdatum` op uit de geparsde BWB-toestand DOM.
 * Root-element is `<toestand inwerkingtredingsdatum="...">` met `<wetgeving><wet-besluit><regeling-info>`.
 * Geeft lege strings terug als de paden niet bestaan (caller valt terug op SRU-metadata).
 */
export function extraheerDocMetadata(dom: Record<string, unknown>): DocMetadata {
  const toestand = dom["toestand"] as Record<string, unknown> | undefined;
  const versiedatum = String(toestand?.["@_inwerkingtreding"] ?? "");
  const wetgeving = toestand?.["wetgeving"] as Record<string, unknown> | undefined;
  const wetBesluit = wetgeving?.["wet-besluit"] as Record<string, unknown> | undefined;
  const regelingInfo = wetBesluit?.["regeling-info"] as Record<string, unknown> | undefined;
  const citeertitel = regelingInfo ? getNrValue(regelingInfo["citeertitel"]) : "";
  return { citeertitel, versiedatum };
}

export interface WetstekstResultaat {
  formatted: string;
  inhoud: string;
  rawXml: string;
  regeling: Regeling;
}

export async function haalWetstekstOp(
  bwbId: string,
  peildatum?: string
): Promise<WetstekstResultaat> {
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

  return { formatted, inhoud: inhoud || "", rawXml, regeling: r };
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
        "De response bevat boven de artikelkop één of meer structuurregels (bijv. 'Hoofdstuk II — titel'), elk op een eigen regel. " +
        "Geeft expliciet aan als het artikel niet gevonden is.",
      inputSchema: {
        type: "object",
        required: ["bwbId", "artikel"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770 (IW 1990)" },
          artikel: {
            type: "string",
            description:
              "Artikelnummer, bijv. '25' (IW 1990) of '3:40' (Awb). " +
              "Gebruik 'N.M'-notatie om één lid op te vragen: '9.1' haalt artikel 9, lid 1 op.",
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
      const { artikelnr, lidnr } = parseerArtikelParam(artikel);
      const { regeling, rawXml, inhoud } = await haalWetstekstOp(bwbId, peildatum);

      // Haal citeertitel + inwerkingtredingsdatum uit DOM; valt terug op SRU-metadata
      let wetNaam = regeling.titel;
      let versiedatum = regeling.geldigVanaf;
      if (rawXml) {
        const docDom = wetParser.parse(rawXml) as Record<string, unknown>;
        const meta = extraheerDocMetadata(docDom);
        if (meta.citeertitel) wetNaam = meta.citeertitel;
        if (meta.versiedatum) versiedatum = meta.versiedatum;
      }
      const header = `${wetNaam} > Versie geldig op: ${versiedatum}`;

      // Ophaalstrategie bij N.M-notatie:
      // 1. Probeer het volledige artikelnummer exact (Leidraad: "25.1" is een eigen sub-artikel)
      // 2. Als niet gevonden én er was een punt: probeer artikel N met lid-filter M
      let artikelTekst: string | null = null;
      let gebruiktArtikel = artikel;
      let gebruiktLid: string | null = null;

      if (rawXml) {
        artikelTekst = extraheerArtikelUitXml(rawXml, artikel);
        if (!artikelTekst && lidnr !== null) {
          artikelTekst = extraheerArtikelUitXml(rawXml, artikelnr, lidnr);
          if (artikelTekst) {
            gebruiktArtikel = artikelnr;
            gebruiktLid = lidnr;
          }
        }
      }

      // Fallback naar tekstgebaseerde extractie (geen lid-filter mogelijk)
      if (!artikelTekst) {
        artikelTekst = extraheerArtikel(inhoud, artikel) ?? (lidnr !== null ? extraheerArtikel(inhoud, artikelnr) : null);
        if (artikelTekst && lidnr !== null) gebruiktArtikel = artikelnr;
      }

      const jci = bouwJciUri(bwbId, gebruiktArtikel, gebruiktLid ?? undefined);

      if (artikelTekst) {
        const statusWaarschuwing = detecteerArtikelStatus(rawXml, gebruiktArtikel);
        if (statusWaarschuwing) {
          artikelTekst = `⚠️ ${statusWaarschuwing}\n\n${artikelTekst}`;
        }
        return {
          content: [{ type: "text", text: `${header}\n\n${artikelTekst}\n\nBronreferentie: ${jci}` }],
        };
      }
      return {
        content: [{ type: "text", text: `${header}\n\nArtikel ${artikel} niet gevonden in deze wet.` }],
      };
    }

    if (name === "wettenbank_zoekterm") {
      const { bwbId, zoekterm, peildatum } = args as Record<string, string>;
      const { rawXml, regeling } = await haalWetstekstOp(bwbId, peildatum);

      // Haal citeertitel + versiedatum uit DOM; valt terug op SRU-metadata
      let wetNaam = regeling.titel;
      let versiedatum = regeling.geldigVanaf;
      if (!rawXml) {
        return {
          content: [{ type: "text", text: `${wetNaam} > Versie geldig op: ${versiedatum}\n\n(Wetstekst niet beschikbaar)` }],
        };
      }

      const dom = wetParser.parse(rawXml) as Record<string, unknown>;
      const meta = extraheerDocMetadata(dom);
      if (meta.citeertitel) wetNaam = meta.citeertitel;
      if (meta.versiedatum) versiedatum = meta.versiedatum;
      const header = `${wetNaam} > Versie geldig op: ${versiedatum}`;

      const patroon = new RegExp(bouwTermPatroon(zoekterm), "gi");
      const treffers = zoekTermInArtikelDom(dom, patroon);
      const totaal = treffers.reduce((s, t) => s + t.aantalTreffers, 0);

      if (!treffers.length) {
        return {
          content: [{ type: "text", text: `${header}\n\n"${zoekterm}" niet gevonden in deze wet.` }],
        };
      }

      const samenvatting = `"${zoekterm}" — ${totaal} treffer(s) in ${treffers.length} artikel(en)`;
      const regels = treffers
        .map(t => {
          const ledenStr = t.leden.length > 0 ? ` — lid ${t.leden.join(", ")}` : "";
          const aanroepen = [
            `  → wettenbank_artikel(bwbId="${bwbId}", artikel="${t.artikelnummer}")`,
            ...t.leden.map(l => `  → wettenbank_artikel(bwbId="${bwbId}", artikel="${t.artikelnummer}.${l}")`),
          ].join("\n");
          return `Artikel ${t.artikelnummer} — ${t.aantalTreffers} treffer(s)${ledenStr}\n${aanroepen}`;
        })
        .join("\n\n");

      return {
        content: [{ type: "text", text: `${header}\n\n${samenvatting}\n\n${regels}` }],
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
