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
import { DOMParser } from "@xmldom/xmldom";
import { fileURLToPath } from "url";

import {
  ZoekInputSchema,
  ZoektermInputSchema,
  ArtikelInputSchema,
  ZoekOutputSchema,
  ZoektermOutputSchema,
  ArtikelOutputSchema,
} from "./shared/schemas.js";
import { parseBwb } from "./bwb-parser/index.js";

// ── Types voor xmldom ────────────────────────────────────────────────────────
// xmldom types wijken soms af van de lib.dom.d.ts types in Node.

type XNode = any;
type XElement = any;
type XDocument = any;

// ── Configuratie ─────────────────────────────────────────────────────────────

const SRU_BASE = "https://zoekservice.overheid.nl/sru/Search";
const REPO_BASE = "https://repository.officiele-overheidspublicaties.nl/bwb";

const KERNWET_IDS = `IW 1990 → \`BWBR0004770\` | AWR → \`BWBR0002320\` | Awb → \`BWBR0005537\` | Leidraad 2008 → \`BWBR0024096\``;

const MAX_TREFFERS_PER_ARTIKEL = 100;

export const domParser = new DOMParser();

// ── In-memory Cache ──────────────────────────────────────────────────────────

interface CacheEntry {
  rawXml: string;
  doc: XDocument;
  regeling: Regeling;
  timestamp: number;
}

export const xmlCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1 uur

function getCacheKey(bwbId: string, peildatum: string): string {
  return `${bwbId}|${peildatum}`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function vandaag(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function escapeerRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function bouwTermPatroon(zoekterm: string): string {
  const heeftPrefix = zoekterm.startsWith("*");
  const heeftSuffix = zoekterm.endsWith("*");
  const kern = escapeerRegex(zoekterm.replace(/^\*|\*$/g, ""));
  const pre  = heeftPrefix ? "\\w*" : "\\b";
  const post = heeftSuffix ? "\\w*" : "\\b";
  return `${pre}${kern}${post}`;
}

export function stripXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getElText(parent: XNode | null, tagName: string): string {
  if (!parent) return "";
  const el = parent.getElementsByTagName(tagName)[0];
  return el?.textContent?.trim() ?? "";
}

function getAttr(el: XNode | null, attrName: string): string {
  if (!el) return "";
  return el.getAttribute(attrName) ?? "";
}

function extractTextForSearch(el: XNode): string {
  if (el.nodeType === 3) return el.nodeValue ?? "";
  if (el.nodeType !== 1) return "";
  if (el.tagName === "kop") return "";

  let text = "";
  for (let i = 0; i < el.childNodes.length; i++) {
    text += extractTextForSearch(el.childNodes.item(i));
  }
  return text;
}

function zoekElementInDom(el: XNode, artikelnummer: string): XElement | null {
  if (el.nodeType !== 1) return null;
  const tag = el.tagName;

  if (tag === "artikel" || tag === "circulaire.divisie") {
    const nr = getElText(el.getElementsByTagName("kop")[0], "nr");
    if (nr === artikelnummer) return el;
  }

  for (let i = 0; i < el.childNodes.length; i++) {
    const found = zoekElementInDom(el.childNodes.item(i), artikelnummer);
    if (found) return found;
  }
  return null;
}

// ── SRU & Repository Clients ──────────────────────────────────────────────────

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

export function parseRecords(xml: string): Regeling[] {
  const doc = domParser.parseFromString(xml, "text/xml");
  const records = Array.from(doc.getElementsByTagName("record"));

  return records.map((rec) => {
    const gzd = rec.getElementsByTagName("gzd")[0];
    const owmskern = gzd?.getElementsByTagName("owmskern")[0];
    const bwbipm = gzd?.getElementsByTagName("bwbipm")[0];
    const enrich = gzd?.getElementsByTagName("enrichedData")[0];

    const bwbId = getElText(owmskern, "dcterms:identifier");
    const rgEls = bwbipm ? Array.from(bwbipm.getElementsByTagName("overheidbwb:rechtsgebied")) : [];
    const rechtsgebiedStr = rgEls.map(e => e.textContent?.trim()).filter(Boolean).join(", ");

    return {
      bwbId,
      titel: getElText(owmskern, "dcterms:title"),
      type: getElText(owmskern, "dcterms:type"),
      ministerie: getElText(owmskern, "overheid:authority"),
      rechtsgebied: rechtsgebiedStr,
      geldigVanaf: getElText(bwbipm, "overheidbwb:geldigheidsperiode_startdatum"),
      geldigTot: getElText(bwbipm, "overheidbwb:geldigheidsperiode_einddatum") || "onbepaald",
      gewijzigd: getElText(owmskern, "dcterms:modified"),
      repositoryUrl: getElText(enrich, "overheidbwb:locatie_toestand") || `${REPO_BASE}/${bwbId}/`,
    };
  });
}

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

export interface WetstekstResultaat {
  rawXml: string;
  doc: XDocument;
  regeling: Regeling;
}

export async function haalWetstekstOp(
  bwbId: string,
  peildatum?: string
): Promise<WetstekstResultaat> {
  const datum = peildatum ?? vandaag();
  const cacheKey = getCacheKey(bwbId, datum);
  const cached = xmlCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return { rawXml: cached.rawXml, doc: cached.doc, regeling: cached.regeling };
  }

  const sruXml = await sruRequest(`dcterms.identifier==${bwbId} and overheidbwb.geldigheidsdatum==${datum}`, 1);
  const lijst = parseRecords(sruXml);
  if (!lijst.length) {
    throw new Error(`Geen regeling gevonden voor BWB-id: ${bwbId} op datum ${datum}.`);
  }
  const r = lijst[0];

  const resp = await fetch(r.repositoryUrl);
  if (!resp.ok) throw new Error(`Wetstekst repository onbereikbaar: ${resp.status}`);
  
  const rawXml = await resp.text();
  const doc = domParser.parseFromString(rawXml, "text/xml");

  const result = { rawXml, doc, regeling: r };
  xmlCache.set(cacheKey, { ...result, timestamp: Date.now() });
  
  return result;
}

// ── Metadata & Zoek Logica ────────────────────────────────────────────────────

export interface DocMetadata {
  citeertitel: string;
  versiedatum: string;
}

export function extraheerDocMetadata(doc: XDocument): DocMetadata {
  const toestand = doc.getElementsByTagName("toestand")[0];
  const versiedatum = toestand ? getAttr(toestand, "inwerkingtredingsdatum") : "";
  const regelingInfo = doc.getElementsByTagName("regeling-info")[0];
  const citeertitel = regelingInfo ? getElText(regelingInfo, "citeertitel") : "";
  return { citeertitel, versiedatum };
}

export type ZoekInput =
  | RegExp
  | { patronen: RegExp[]; operator: "EN" | "OF" };

export interface ZoekTermResultaat {
  artikelen: { artikelnummer: string; aantalTreffers: number; leden: string[] }[];
  totaalTreffers: number;
  isVolledig: boolean;
}

export function zoekTermInArtikelDom(
  doc: XDocument | XElement,
  invoer: ZoekInput,
  maxResultaten = 10
): ZoekTermResultaat {
  const { patronen, operator } = invoer instanceof RegExp
    ? { patronen: [invoer], operator: "OF" as const }
    : invoer;

  const tellers = new Map<string, { count: number; leden: Set<string>; matchedPatterns: Set<number> }>();
  let totaalTreffersTeller = 0;

  const articles: XElement[] = [
    ...Array.from(doc.getElementsByTagName("artikel")),
    ...Array.from(doc.getElementsByTagName("circulaire.divisie"))
  ];

  for (const art of articles) {
    const nr = getElText(art.getElementsByTagName("kop")[0], "nr");
    if (!nr) continue;

    const entry = tellers.get(nr) ?? { count: 0, leden: new Set<string>(), matchedPatterns: new Set<number>() };
    const clean = extractTextForSearch(art);
    
    patronen.forEach((pat, i) => {
      const matches = clean.match(pat);
      if (matches) {
        const toAdd = Math.min(matches.length, 100 - entry.count);
        entry.count += toAdd;
        totaalTreffersTeller += toAdd;
        entry.matchedPatterns.add(i);
        tellers.set(nr, entry);
      }
    });

    const lids = Array.from(art.getElementsByTagName("lid"));
    for (const lid of lids) {
      const lidnr = getElText(lid, "lidnr");
      if (!lidnr) continue;
      const lidText = extractTextForSearch(lid);
      if (patronen.some(pat => pat.test(lidText))) {
        entry.leden.add(lidnr);
      }
    }
  }

  const alleArtikelen = Array.from(tellers.entries())
    .filter(([, { matchedPatterns }]) =>
      operator === "EN" ? matchedPatterns.size === patronen.length : matchedPatterns.size > 0
    )
    .map(([artikelnummer, { count, leden }]) => ({
      artikelnummer,
      aantalTreffers: count,
      leden: Array.from(leden).sort((a, b) => {
        const nA = parseFloat(a), nB = parseFloat(b);
        if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
        return a.localeCompare(b);
      }),
    }))
    .sort((a, b) => {
      const nA = parseFloat(a.artikelnummer), nB = parseFloat(b.artikelnummer);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      return a.artikelnummer.localeCompare(b.artikelnummer);
    });

  return {
    artikelen: alleArtikelen.slice(0, maxResultaten),
    totaalTreffers: alleArtikelen.reduce((s, t) => s + t.aantalTreffers, 0),
    isVolledig: true,
  };
}

export function parseZoekterm(zoekterm: string): ZoekInput {
  let t = zoekterm.replace(/ AND /g, " EN ").replace(/ OR /g, " OF ");
  const op = t.includes(" EN ") ? "EN" : "OF";
  const parts = t.split(op === "EN" ? " EN " : " OF ").map(p => p.trim());
  const regexify = (s: string) => {
    const kern = s.replace(/\*/g, "");
    const pre = s.startsWith("*") ? "\\w*" : "\\b";
    const post = s.endsWith("*") ? "\\w*" : "\\b";
    return new RegExp(`${pre}${kern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${post}`, "gi");
  };
  return { patronen: parts.map(regexify), operator: op };
}

// ── MCP Server setup ─────────────────────────────────────────────────────────

const server = new Server(
  { name: "wettenbank-mcp", version: "2.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "wettenbank_zoek",
      description: "Zoek Nederlandse regelingen op naam en retourneer BWB-id + metadata.",
      inputSchema: {
        type: "object",
        properties: {
          titel: { type: "string", description: "Zoekterm in de titel, bijv. 'Invorderingswet'" },
          rechtsgebied: { type: "string", description: "bijv. belastingrecht, arbeidsrecht" },
          ministerie: { type: "string", description: "bijv. Financiën, Justitie" },
          regelingsoort: { type: "string", enum: ["wet", "AMvB", "ministeriele-regeling", "regeling", "besluit"] },
          maxResultaten: { type: "number", default: 10 },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD; default is vandaag." },
        },
      },
    },
    {
      name: "wettenbank_artikel",
      description: "Haal één artikel op uit een Nederlandse wet in schone Markdown.",
      inputSchema: {
        type: "object",
        required: ["bwbId", "artikel"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770" },
          artikel: { type: "string", description: "Artikelnummer, bijv. '25' of '3:40'." },
          lid: { type: "string", description: "Optioneel lidnummer." },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD; default is vandaag." },
        },
      },
    },
    {
      name: "wettenbank_zoekterm",
      description: "Zoek welke artikelen een begrip bevatten in één Nederlandse wet.",
      inputSchema: {
        type: "object",
        required: ["bwbId", "zoekterm"],
        properties: {
          bwbId: { type: "string", description: "BWB-id, bijv. BWBR0004770" },
          zoekterm: { type: "string", description: "Te zoeken begrip (EN/OF operators toegestaan)." },
          peildatum: { type: "string", description: "Datum YYYY-MM-DD." },
          maxResultaten: { type: "number", default: 10 },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    if (name === "wettenbank_zoek") {
      const parsed = ZoekInputSchema.safeParse(args);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { titel, rechtsgebied, ministerie, regelingsoort, maxResultaten, peildatum } = parsed.data;

      const queryDelen: string[] = [];
      if (titel) queryDelen.push(`overheidbwb.titel any "${titel}"`);
      if (rechtsgebied) queryDelen.push(`overheidbwb.rechtsgebied == "${rechtsgebied}"`);
      if (ministerie) queryDelen.push(`overheid.authority == "${ministerie}"`);
      if (regelingsoort) queryDelen.push(`dcterms.type == "${regelingsoort}"`);
      queryDelen.push(`overheidbwb.geldigheidsdatum==${peildatum}`);

      const xml = await sruRequest(queryDelen.join(" and "), maxResultaten);
      const regelingen = dedupliceerOpBwbId(parseRecords(xml));

      return { content: [{ type: "text", text: JSON.stringify({ totaal: regelingen.length, regelingen }) }] };
    }

    if (name === "wettenbank_artikel") {
      const parsed = ArtikelInputSchema.safeParse(args);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { bwbId, artikel, lid, peildatum } = parsed.data;
      const lidnr = lid?.trim() || null;

      const { doc, regeling } = await haalWetstekstOp(bwbId, peildatum);
      const meta = extraheerDocMetadata(doc);
      const wetNaam = meta.citeertitel || regeling.titel;

      const { transformToMcpLite, normalizeNode, parseElement } = await import("./bwb-parser/index.js");
      const artikelElement = zoekElementInDom(doc.documentElement, artikel);

      if (!artikelElement) {
        return { content: [{ type: "text", text: JSON.stringify({ fout: `Artikel ${artikel} niet gevonden.` }) }] };
      }

      const rawNode = parseElement(artikelElement, bwbId, []);
      const normalized = normalizeNode(rawNode);
      let results = transformToMcpLite(normalized, bwbId, wetNaam);
      
      if (lidnr) {
        results = results.filter(n => n.sectie.endsWith(` > Lid ${lidnr}`));
      }

      const output = {
        citeertitel: wetNaam,
        versiedatum: meta.versiedatum || regeling.geldigVanaf,
        bwbId,
        artikel,
        ...(lidnr && { lid: lidnr }),
        sectie: results[0]?.sectie.split(" > Lid ")[0],
        leden: results.map(r => ({
          lid: r.sectie.match(/Lid (.*)$/)?.[1] || "",
          tekst: r.tekst
        })),
        bronreferentie: `jci1.3:c:${bwbId}&artikel=${artikel}`,
      };

      return { content: [{ type: "text", text: JSON.stringify(output) }] };
    }

    if (name === "wettenbank_zoekterm") {
      const parsed = ZoektermInputSchema.safeParse(args);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      const { bwbId, zoekterm, peildatum, maxResultaten } = parsed.data;

      const { doc, regeling } = await haalWetstekstOp(bwbId, peildatum);
      const meta = extraheerDocMetadata(doc);
      const resultaat = zoekTermInArtikelDom(doc, parseZoekterm(zoekterm), maxResultaten);

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            wet: meta.citeertitel || regeling.titel,
            bwbId,
            zoekterm,
            ...resultaat
          })
        }]
      };
    }

    return { content: [{ type: "text", text: `Onbekende tool: ${name}` }], isError: true };
  } catch (err) {
    return { content: [{ type: "text", text: JSON.stringify({ fout: (err as any).message }) }], isError: true };
  }
});

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
