/**
 * Tool handler: wettenbank_artikel
 * Haalt één artikel op en retourneert gestructureerde Markdown-JSON.
 */

import { ArtikelInputSchema } from "../shared/schemas.js";
import {
  haalWetstekstOp,
  extraheerDocMetadata,
  zoekElementInDom,
} from "../clients/repository-client.js";
import {
  parseElement,
  normalizeNode,
  transformToMcpLite,
} from "../bwb-parser/index.js";

function detecteerFormaat(tekst: string): "plain" | "markdown" {
  if (/\|.*\|/.test(tekst)) return "markdown";   // tabel
  if (/^\d+\. /m.test(tekst)) return "markdown";  // genummerde lijst
  if (/^[a-z]\. /m.test(tekst)) return "markdown"; // lettertjes-lijst
  if (/^– /m.test(tekst)) return "markdown";       // streepjes-lijst
  return "plain";
}

export async function handleArtikel(args: unknown): Promise<string> {
  const parsed = ArtikelInputSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const { bwbId, artikel, lid, peildatum } = parsed.data;
  const lidnr = lid?.trim() || null;

  const { doc, regeling } = await haalWetstekstOp(bwbId, peildatum);
  const meta = extraheerDocMetadata(doc);
  const wetNaam = meta.citeertitel || regeling.titel;

  const artikelElement = zoekElementInDom(doc.documentElement, artikel);
  if (!artikelElement) {
    return JSON.stringify({ fout: `Artikel ${artikel} niet gevonden.` });
  }

  const rawNode = parseElement(artikelElement, bwbId, []);
  const normalized = normalizeNode(rawNode);
  let results = transformToMcpLite(normalized, bwbId, wetNaam);

  if (lidnr) {
    results = results.filter((n) => n.sectie.endsWith(` > Lid ${lidnr}`));
  }

  // Bouw structuurpad uit het eerste resultaat via sectie-pad
  const eersteSectie = results[0]?.sectie ?? "";
  const sectionDelen = eersteSectie.split(" > ");
  // pad = volledig pad tot artikel-niveau (zonder "Lid X")
  const padDelen = sectionDelen.filter((d) => !d.startsWith("Lid "));
  const pad = padDelen.join(" > ") || undefined;
  const sectie = padDelen[padDelen.length - 1] || undefined;

  const ledenData = results.map((r) => ({
    lid: r.sectie.match(/Lid (.*)$/)?.[1] || "",
    tekst: r.tekst,
  }));

  const alleeTekst = ledenData.map((l) => l.tekst).join("\n");
  const formaat = detecteerFormaat(alleeTekst);

  return JSON.stringify({
    formaat,
    citeertitel: wetNaam,
    versiedatum: meta.versiedatum || regeling.geldigVanaf,
    bwbId,
    artikel,
    ...(lidnr && { lid: lidnr }),
    ...(sectie && { sectie }),
    ...(pad && { pad }),
    leden: ledenData,
    bronreferentie: `jci1.3:c:${bwbId}&artikel=${artikel}`,
  });
}
