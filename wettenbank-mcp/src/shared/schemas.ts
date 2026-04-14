/**
 * Zod-schemas voor alle MCP tool inputs en outputs.
 * Dient als contractdefinitie; de gateway valideert hiertegen bij elke aanroep.
 */

import { z } from "zod";

function vandaag(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Input schemas ─────────────────────────────────────────────────────────────

export const ZoekInputSchema = z
  .object({
    titel: z.string().optional(),
    rechtsgebied: z.string().optional(),
    ministerie: z.string().optional(),
    regelingsoort: z
      .enum(["wet", "AMvB", "ministeriele-regeling", "regeling", "besluit"])
      .optional(),
    maxResultaten: z.number().int().min(1).max(50).default(10),
    // .default(vandaag) — Zod v3 accepteert een factory-function; wordt lazy geëvalueerd per parse-call.
    // .default(vandaag()) zou fout zijn: evalueert eenmalig bij module-load en bevriest de datum.
    peildatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "peildatum moet YYYY-MM-DD zijn").default(vandaag),
  })
  .refine(
    (d) => d.titel || d.rechtsgebied || d.ministerie || d.regelingsoort,
    "Geef minimaal één zoekcriterium op (titel, rechtsgebied, ministerie of regelingsoort)."
  );

export const ZoektermInputSchema = z.object({
  bwbId: z.string().min(1, "bwbId mag niet leeg zijn"),
  zoekterm: z.string().min(1, "zoekterm mag niet leeg zijn"),
  peildatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "peildatum moet YYYY-MM-DD zijn").default(vandaag),
  maxResultaten: z.number().int().min(1).max(50).default(10),
});

export const ArtikelInputSchema = z.object({
  bwbId: z.string().min(1, "bwbId mag niet leeg zijn"),
  artikel: z.string().min(1, "artikel mag niet leeg zijn"),
  lid: z.string().nullish(),
  peildatum: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "peildatum moet YYYY-MM-DD zijn").default(vandaag),
});

// ── Output schemas ────────────────────────────────────────────────────────────

export const RegelingSchema = z.object({
  bwbId: z.string(),
  titel: z.string(),
  type: z.string(),
  ministerie: z.string(),
  rechtsgebied: z.string(),
  geldigVanaf: z.string(),
  geldigTot: z.string(),
  gewijzigd: z.string(),
  repositoryUrl: z.string(),
});

export const ZoekOutputSchema = z.object({
  query: z.string(),
  totaal: z.number(),
  dubbeleVerwijderd: z.number(),
  regelingen: z.array(RegelingSchema),
});

export const ZoektermOutputSchema = z.object({
  wet: z.string(),
  versiedatum: z.string(),
  bwbId: z.string(),
  zoekterm: z.string(),
  // null wanneer isVolledig=false (toekomstige streaming-implementatie);
  // bij DOM-parsing (volledige scan) is dit altijd een getal.
  totaalTreffers: z.number().nullable(),
  // true = volledige scan uitgevoerd; false = afgebroken na maxResultaten (nog niet geïmplementeerd voor DOM)
  isVolledig: z.boolean(),
  aantalArtikelen: z.number(),
  artikelen: z.array(
    z.object({
      artikel: z.string(),
      aantalTreffers: z.number(),
      leden: z.array(z.string()), // welke lidnummers bevatten de term
    })
  ),
});

export const ArtikelOutputSchema = z.object({
  citeertitel: z.string(),
  versiedatum: z.string(),
  bwbId: z.string(),
  artikel: z.string(),
  lid: z.string().optional(),
  sectie: z.string().optional(), // Bijv. "Hoofdstuk 1 > Artikel 1"
  structuurpad: z.array(z.string()),
  leden: z.array(z.object({ lid: z.string(), tekst: z.string() })),
  bronreferentie: z.string(),
  waarschuwing: z.string().nullable(),
});

// Foutformat — behouden voor backwards-compatibiliteit met bestaande consumers
export const FoutOutputSchema = z.object({
  fout: z.string(),
});

// Inferred TypeScript-typen
export type ZoekInput = z.infer<typeof ZoekInputSchema>;
export type ZoektermInput = z.infer<typeof ZoektermInputSchema>;
export type ArtikelInput = z.infer<typeof ArtikelInputSchema>;
export type ZoekOutput = z.infer<typeof ZoekOutputSchema>;
export type ZoektermOutput = z.infer<typeof ZoektermOutputSchema>;
export type ArtikelOutput = z.infer<typeof ArtikelOutputSchema>;
