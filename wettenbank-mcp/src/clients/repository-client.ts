/**
 * Repository-client voor officiele-overheidspublicaties.nl
 * Haalt BWB-wetstekst XML op, beheert in-memory cache en extraheert doc-metadata.
 */

import { domParser, sruRequest, parseRecords, getElText, getAttr } from "./sru-client.js";
import type { Regeling } from "./sru-client.js";

type XNode = any;
type XElement = any;
type XDocument = any;

// ── Cache ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function vandaag(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WetstekstResultaat {
  rawXml: string;
  doc: XDocument;
  regeling: Regeling;
}

export interface DocMetadata {
  citeertitel: string;
  versiedatum: string;
}

// ── Functies ──────────────────────────────────────────────────────────────────

export async function haalWetstekstOp(
  bwbId: string,
  peildatum?: string
): Promise<WetstekstResultaat> {
  const datum = peildatum ?? vandaag();
  const cacheKey = getCacheKey(bwbId, datum);
  const cached = xmlCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { rawXml: cached.rawXml, doc: cached.doc, regeling: cached.regeling };
  }

  const sruXml = await sruRequest(
    `dcterms.identifier==${bwbId} and overheidbwb.geldigheidsdatum==${datum}`,
    1
  );
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

export function extraheerDocMetadata(doc: XDocument): DocMetadata {
  const toestand = doc.getElementsByTagName("toestand")[0];
  const versiedatum = toestand ? getAttr(toestand, "inwerkingtredingsdatum") : "";
  const regelingInfo = doc.getElementsByTagName("regeling-info")[0];
  const citeertitel = regelingInfo ? getElText(regelingInfo, "citeertitel") : "";
  return { citeertitel, versiedatum };
}

export function zoekElementInDom(el: XNode, artikelnummer: string): XElement | null {
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

export function extractTextForSearch(el: XNode): string {
  if (el.nodeType === 3) return el.nodeValue ?? "";
  if (el.nodeType !== 1) return "";
  if (el.tagName === "kop") return "";

  let text = "";
  for (let i = 0; i < el.childNodes.length; i++) {
    text += extractTextForSearch(el.childNodes.item(i));
  }
  return text;
}
