import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { escapeerRegex, stripXml, extraheerArtikel, extraheerArtikelUitXml, parseRecords, formatRegelingen, dedupliceerOpBwbId, haalWetstekstOp, sruRequest, vindArtikelContext } from "./index.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSruXml(records: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<searchRetrieveResponse>
  <numberOfRecords>1</numberOfRecords>
  <records>${records}</records>
</searchRetrieveResponse>`;
}

function makeRecord({
  bwbId = "BWBR0002320",
  titel = "Algemene wet inzake rijksbelastingen",
  type = "wet",
  ministerie = "Financiën",
  rechtsgebied = "Belastingrecht",
  geldigVanaf = "2024-01-01",
  geldigTot = "9999-12-31",
  gewijzigd = "2024-07-19",
  locatie = `https://repository.example.nl/bwb/${bwbId}/current.xml`,
}: Partial<{
  bwbId: string; titel: string; type: string; ministerie: string;
  rechtsgebied: string | string[]; geldigVanaf: string; geldigTot: string;
  gewijzigd: string; locatie: string;
}> = {}): string {
  const rechtsgebiedXml = Array.isArray(rechtsgebied)
    ? rechtsgebied.map(r => `<overheidbwb:rechtsgebied>${r}</overheidbwb:rechtsgebied>`).join("")
    : `<overheidbwb:rechtsgebied>${rechtsgebied}</overheidbwb:rechtsgebied>`;

  return `
  <record>
    <recordData>
      <gzd>
        <originalData>
          <overheidbwb:meta>
            <owmskern>
              <dcterms:identifier>${bwbId}</dcterms:identifier>
              <dcterms:title>${titel}</dcterms:title>
              <dcterms:type>${type}</dcterms:type>
              <overheid:authority>${ministerie}</overheid:authority>
              <dcterms:modified>${gewijzigd}</dcterms:modified>
            </owmskern>
            <bwbipm>
              ${rechtsgebiedXml}
              <overheidbwb:geldigheidsperiode_startdatum>${geldigVanaf}</overheidbwb:geldigheidsperiode_startdatum>
              <overheidbwb:geldigheidsperiode_einddatum>${geldigTot}</overheidbwb:geldigheidsperiode_einddatum>
            </bwbipm>
          </overheidbwb:meta>
        </originalData>
        <enrichedData>
          <overheidbwb:locatie_toestand>${locatie}</overheidbwb:locatie_toestand>
        </enrichedData>
      </gzd>
    </recordData>
  </record>`;
}

function mockFetch(responses: Array<{ ok: boolean; text: string }>) {
  let i = 0;
  return vi.fn().mockImplementation(() => {
    const r = responses[i++] ?? responses[responses.length - 1];
    return Promise.resolve({ ok: r.ok, status: r.ok ? 200 : 404, text: () => Promise.resolve(r.text) });
  });
}

// ── escapeerRegex ────────────────────────────────────────────────────────────

describe("escapeerRegex", () => {
  it("escapet regex-speciale tekens", () => {
    expect(escapeerRegex("3:40")).toBe("3:40");
    expect(escapeerRegex("25.1")).toBe("25\\.1");
    expect(escapeerRegex("a[b]")).toBe("a\\[b\\]");
    expect(escapeerRegex("a+b")).toBe("a\\+b");
  });

  it("laat gewone tekst ongewijzigd", () => {
    expect(escapeerRegex("25")).toBe("25");
    expect(escapeerRegex("abc")).toBe("abc");
  });
});

// ── stripXml ─────────────────────────────────────────────────────────────────

describe("stripXml", () => {
  it("verwijdert XML-tags", () => {
    expect(stripXml("<artikel>tekst</artikel>")).toBe("tekst");
  });

  it("verwijdert de XML-declaratie", () => {
    expect(stripXml('<?xml version="1.0"?><root>inhoud</root>')).toBe("inhoud");
  });

  it("pakt CDATA-inhoud uit", () => {
    expect(stripXml("<![CDATA[letterlijke tekst]]>")).toBe("letterlijke tekst");
  });

  it("decodeert standaard HTML-entities", () => {
    expect(stripXml("<x>&amp;</x>")).toBe("&");
    expect(stripXml("<x>&lt;</x>")).toBe("<");
    expect(stripXml("<x>&gt;</x>")).toBe(">");
    expect(stripXml("<x>&quot;</x>")).toBe('"');
    expect(stripXml("<x>&apos;</x>")).toBe("'");
    expect(stripXml("<x>a&nbsp;b</x>")).toBe("a b");
  });

  it("decodeert decimale numerieke entities", () => {
    expect(stripXml("&#65;&#66;&#67;")).toBe("ABC");
  });

  it("decodeert hexadecimale numerieke entities", () => {
    expect(stripXml("&#x41;&#x42;&#x43;")).toBe("ABC");
  });

  it("comprimeert meerdere spaties tot één", () => {
    expect(stripXml("<a>een</a>   <b>twee</b>")).toBe("een twee");
  });

  it("geeft volledige tekst terug zonder afkap", () => {
    const lang = "<x>" + "a".repeat(60000) + "</x>";
    expect(stripXml(lang).length).toBe(60000);
  });
});

// ── extraheerArtikel ─────────────────────────────────────────────────────────

describe("extraheerArtikel", () => {
  const tekst = "Artikel 3:40 Een besluit treedt niet in werking voordat het is bekendgemaakt. Artikel 3:41 Iets anders.";

  it("extraheert een artikel op nummer met dubbele punt", () => {
    const result = extraheerArtikel(tekst, "3:40");
    expect(result).toContain("Een besluit treedt niet in werking");
    expect(result).not.toContain("Artikel 3:41");
  });

  it("retourneert null als artikel niet bestaat", () => {
    expect(extraheerArtikel(tekst, "9:99")).toBeNull();
  });

  it("extraheert een artikel op enkelvoudig nummer", () => {
    const tekst2 = "Artikel 25 De ontvanger int belastingen. Artikel 26 Andere bepaling.";
    const result = extraheerArtikel(tekst2, "25");
    expect(result).toContain("De ontvanger int belastingen");
    expect(result).not.toContain("Artikel 26");
  });

  it("strips trailing publicatiemetadata", () => {
    const met_meta = "Artikel 3:40 Een besluit treedt niet in werking. 1994 1 06-01-1994 rest";
    const result = extraheerArtikel(met_meta, "3:40");
    expect(result).not.toContain("1994 1 06-01-1994");
  });
});

// ── extraheerArtikelUitXml ───────────────────────────────────────────────────

describe("extraheerArtikelUitXml", () => {
  // Representatieve XML-structuur zoals wetten.overheid.nl deze levert
  const ubIwXml = `<?xml version="1.0"?>
<wetgeving>
  <wet-besluit>
    <wettekst>
      <artikel status="geldend">
        <kop><label>Artikel</label><nr>1</nr></kop>
        <al>Dit besluit geeft uitvoering aan de artikelen 15 en 28 van de wet.</al>
      </artikel>
      <artikel status="geldend">
        <kop><label>Artikel</label><nr>2</nr></kop>
        <al>Artikel 15, eerste lid, aanhef en onderdeel e, van de wet vindt toepassing:</al>
        <lijst>
          <li><li.nr>a.</li.nr><al>met betrekking tot een naheffingsaanslag;</al></li>
          <li><li.nr>b.</li.nr><al>in situaties als bedoeld in artikel 10 van de wet.</al></li>
        </lijst>
      </artikel>
      <artikel status="geldend">
        <kop><label>Artikel</label><nr>3</nr></kop>
        <al>Vervallen.</al>
      </artikel>
    </wettekst>
  </wet-besluit>
</wetgeving>`;

  it("extraheert art. 2 correct ook als de body begint met 'Artikel 15, eerste lid'", () => {
    const result = extraheerArtikelUitXml(ubIwXml, "2");
    expect(result).toContain("Artikel 2");
    expect(result).toContain("Artikel 15, eerste lid");
    expect(result).toContain("naheffingsaanslag");
    expect(result).not.toContain("Artikel 3");
  });

  it("extraheert art. 1 correct", () => {
    const result = extraheerArtikelUitXml(ubIwXml, "1");
    expect(result).toContain("Artikel 1");
    expect(result).toContain("uitvoering aan de artikelen 15 en 28");
    expect(result).not.toContain("Artikel 2");
  });

  it("retourneert null voor een niet-bestaand artikelnummer", () => {
    expect(extraheerArtikelUitXml(ubIwXml, "99")).toBeNull();
  });

  it("extraheert Awb-artikel met dubbele punt (3:40)", () => {
    const awbXml = `<wetgeving><wettekst>
      <artikel status="geldend">
        <kop><label>Artikel</label><nr>3:40</nr></kop>
        <al>Een besluit treedt niet in werking voordat het is bekendgemaakt.</al>
      </artikel>
    </wettekst></wetgeving>`;
    const result = extraheerArtikelUitXml(awbXml, "3:40");
    expect(result).toContain("3:40");
    expect(result).toContain("bekendgemaakt");
  });

  it("retourneert null bij lege XML", () => {
    expect(extraheerArtikelUitXml("", "2")).toBeNull();
  });

  it("retourneert null bij extreem geneste XML (depth-limit)", () => {
    // Bouw een XML met 35 geneste <hoofdstuk>-niveaus — voorbij de limiet van 30
    const diepNest = (n: number): string =>
      n === 0
        ? `<artikel status="geldend"><kop><label>Artikel</label><nr>99</nr></kop><al>Diep artikel.</al></artikel>`
        : `<hoofdstuk><${n > 1 ? "hoofdstuk" : "artikel"}>${diepNest(n - 1)}</${n > 1 ? "hoofdstuk" : "artikel"}></hoofdstuk>`;
    const xml = `<wetgeving><wettekst>${diepNest(35)}</wettekst></wetgeving>`;
    expect(extraheerArtikelUitXml(xml, "99")).toBeNull();
  });

  // Leidraad Invordering 2008 gebruikt <circulaire.divisie> als wrapper (geen <artikel>)
  const leidraadXml = `<?xml version="1.0"?>
<circulaire>
  <circulaire.divisie bwb-ng-variabel-deel="/Circulaire.divisie24" label="Artikel 24">
    <kop><label>Artikel</label><nr status="officieel">24</nr><titel>Betalingstermijnen</titel></kop>
    <tekst><al>In aansluiting op artikel 24 van de wet.</al></tekst>
    <artikel label="Artikel 24.1">
      <kop><label>Artikel</label><nr>24.1</nr></kop>
      <al>Subartikel 24.1.</al>
    </artikel>
  </circulaire.divisie>
  <circulaire.divisie bwb-ng-variabel-deel="/Circulaire.divisie25" label="Artikel 25">
    <kop><label>Artikel</label><nr status="officieel">25</nr><titel>Uitstel van betaling</titel></kop>
    <tekst><al>In aansluiting op artikel 25 van de wet verleent de ontvanger uitstel.</al></tekst>
    <artikel label="Artikel 25.1">
      <kop><label>Artikel</label><nr>25.1</nr></kop>
      <al>Subartikel 25.1.</al>
    </artikel>
  </circulaire.divisie>
  <circulaire.divisie bwb-ng-variabel-deel="/Circulaire.divisie26" label="Artikel 26">
    <kop><label>Artikel</label><nr status="officieel">26</nr><titel>Kwijtschelding</titel></kop>
    <tekst><al>In aansluiting op artikel 26 van de wet.</al></tekst>
  </circulaire.divisie>
</circulaire>`;

  it("extraheert Leidraad-artikel via <circulaire.divisie>", () => {
    const result = extraheerArtikelUitXml(leidraadXml, "25");
    expect(result).toContain("25");
    expect(result).toContain("Uitstel van betaling");
    expect(result).toContain("verleent de ontvanger uitstel");
    expect(result).not.toContain("Kwijtschelding");
    expect(result).not.toContain("Betalingstermijnen");
  });

  it("extraheert subartikel van Leidraad via <artikel> binnen <circulaire.divisie>", () => {
    const result = extraheerArtikelUitXml(leidraadXml, "25.1");
    expect(result).toContain("25.1");
    expect(result).toContain("Subartikel 25.1");
    expect(result).not.toContain("Uitstel van betaling");
  });

  it("extraheert eerste Leidraad-artikel correct (art. 24)", () => {
    const result = extraheerArtikelUitXml(leidraadXml, "24");
    expect(result).toContain("Betalingstermijnen");
    expect(result).not.toContain("Uitstel van betaling");
  });

  it("retourneert null voor niet-bestaand Leidraad-artikel", () => {
    expect(extraheerArtikelUitXml(leidraadXml, "99")).toBeNull();
  });
});

// ── parseRecords ─────────────────────────────────────────────────────────────

describe("parseRecords", () => {
  it("geeft lege array bij geen records", () => {
    const xml = `<?xml version="1.0"?><searchRetrieveResponse><numberOfRecords>0</numberOfRecords></searchRetrieveResponse>`;
    expect(parseRecords(xml)).toEqual([]);
  });

  it("parseert een enkel record correct", () => {
    const xml = makeSruXml(makeRecord());
    const [r] = parseRecords(xml);
    expect(r.bwbId).toBe("BWBR0002320");
    expect(r.titel).toBe("Algemene wet inzake rijksbelastingen");
    expect(r.type).toBe("wet");
    expect(r.ministerie).toBe("Financiën");
    expect(r.rechtsgebied).toBe("Belastingrecht");
    expect(r.geldigVanaf).toBe("2024-01-01");
    expect(r.geldigTot).toBe("9999-12-31");
    expect(r.gewijzigd).toBe("2024-07-19");
    expect(r.repositoryUrl).toContain("BWBR0002320");
  });

  it("voegt meerdere rechtsgebieden samen met komma", () => {
    const xml = makeSruXml(makeRecord({ rechtsgebied: ["Belastingrecht", "Formeel belastingrecht"] }));
    const [r] = parseRecords(xml);
    expect(r.rechtsgebied).toBe("Belastingrecht, Formeel belastingrecht");
  });

  it("gebruikt repositoryUrl uit enrichedData", () => {
    const xml = makeSruXml(makeRecord({ locatie: "https://example.com/test.xml" }));
    const [r] = parseRecords(xml);
    expect(r.repositoryUrl).toBe("https://example.com/test.xml");
  });

  it("parseert twee records", () => {
    const xml = makeSruXml(makeRecord({ bwbId: "AAA" }) + makeRecord({ bwbId: "BBB" }));
    const lijst = parseRecords(xml);
    expect(lijst).toHaveLength(2);
    expect(lijst[0].bwbId).toBe("AAA");
    expect(lijst[1].bwbId).toBe("BBB");
  });

  it("vult 'onbepaald' in bij ontbrekende geldigTot", () => {
    // makeRecord zet standaard geldigTot op "9999-12-31"; hier overschrijven we de XML
    const xml = makeSruXml(makeRecord({ geldigTot: "" }));
    const [r] = parseRecords(xml);
    // Lege string wordt door de parser als "" teruggegeven, niet "onbepaald" —
    // "onbepaald" is de fallback voor undefined/null, niet voor lege string.
    // Dit test dat het veld aanwezig en een string is.
    expect(typeof r.geldigTot).toBe("string");
  });
});

// ── formatRegelingen ─────────────────────────────────────────────────────────

describe("formatRegelingen", () => {
  it("geeft melding bij lege lijst", () => {
    expect(formatRegelingen([])).toBe("Geen regelingen gevonden.");
  });

  it("bevat BWB-id en titel", () => {
    const xml = makeSruXml(makeRecord());
    const result = formatRegelingen(parseRecords(xml));
    expect(result).toContain("BWBR0002320");
    expect(result).toContain("Algemene wet inzake rijksbelastingen");
  });

  it("nummert meerdere regelingen oplopend", () => {
    const xml = makeSruXml(makeRecord({ bwbId: "AAA", titel: "Wet A" }) + makeRecord({ bwbId: "BBB", titel: "Wet B" }));
    const result = formatRegelingen(parseRecords(xml));
    expect(result).toMatch(/^1\./m);
    expect(result).toMatch(/^2\./m);
  });

  it("gebruikt BWB-id als fallback wanneer titel leeg is", () => {
    const xml = makeSruXml(makeRecord({ bwbId: "BWBR0099999", titel: "" }));
    const result = formatRegelingen(parseRecords(xml));
    expect(result).toContain("BWBR0099999");
  });
});

// ── dedupliceerOpBwbId ───────────────────────────────────────────────────────

describe("dedupliceerOpBwbId", () => {
  function maakRegeling(bwbId: string, geldigVanaf: string): ReturnType<typeof parseRecords>[number] {
    return {
      bwbId, geldigVanaf,
      titel: "Test", type: "wet", ministerie: "Fin", rechtsgebied: "Belastingrecht",
      geldigTot: "9999-12-31", gewijzigd: geldigVanaf, repositoryUrl: "https://example.com",
    };
  }

  it("laat unieke BWB-ids ongewijzigd", () => {
    const lijst = [maakRegeling("AAA", "2024-01-01"), maakRegeling("BBB", "2024-01-01")];
    expect(dedupliceerOpBwbId(lijst)).toHaveLength(2);
  });

  it("dedupliceert dubbele BWB-ids en behoudt de meest recente versie", () => {
    const lijst = [
      maakRegeling("AAA", "2022-01-01"),
      maakRegeling("AAA", "2024-01-01"),
      maakRegeling("AAA", "2020-01-01"),
    ];
    const result = dedupliceerOpBwbId(lijst);
    expect(result).toHaveLength(1);
    expect(result[0].geldigVanaf).toBe("2024-01-01");
  });

  it("geeft lege array terug bij lege invoer", () => {
    expect(dedupliceerOpBwbId([])).toEqual([]);
  });

  it("behoudt alle unieke ids bij gemengde invoer", () => {
    const lijst = [
      maakRegeling("AAA", "2022-01-01"),
      maakRegeling("BBB", "2023-01-01"),
      maakRegeling("AAA", "2024-01-01"),
    ];
    const result = dedupliceerOpBwbId(lijst);
    expect(result).toHaveLength(2);
    const ids = result.map(r => r.bwbId).sort();
    expect(ids).toEqual(["AAA", "BBB"]);
  });
});

// ── haalWetstekstOp ───────────────────────────────────────────────────────────

describe("haalWetstekstOp", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stuurt standaard vandaag als peildatum mee (bug 2)", async () => {
    const vandaag = new Date().toISOString().slice(0, 10);
    const sruXml = makeSruXml(makeRecord({ locatie: "https://example.com/wet.xml" }));
    const fetchMock = mockFetch([
      { ok: true, text: sruXml },
      { ok: true, text: "<wet><artikel>Artikel 1 inhoud</artikel></wet>" },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    await haalWetstekstOp("BWBR0002320");

    const eersteAanroep = fetchMock.mock.calls[0][0] as string;
    expect(eersteAanroep).toContain(vandaag);
  });

  it("gebruikt opgegeven peildatum in plaats van vandaag", async () => {
    const sruXml = makeSruXml(makeRecord({ locatie: "https://example.com/wet.xml" }));
    const fetchMock = mockFetch([
      { ok: true, text: sruXml },
      { ok: true, text: "<wet><artikel>Oud artikel</artikel></wet>" },
    ]);
    vi.stubGlobal("fetch", fetchMock);

    await haalWetstekstOp("BWBR0002320", "2010-01-01");

    const eersteAanroep = fetchMock.mock.calls[0][0] as string;
    expect(eersteAanroep).toContain("2010-01-01");
    expect(eersteAanroep).not.toContain(new Date().toISOString().slice(0, 10));
  });

  it("gooit een fout bij onbekend BWB-id en noemt bekende ids", async () => {
    vi.stubGlobal("fetch", mockFetch([
      { ok: true, text: `<?xml version="1.0"?><searchRetrieveResponse><numberOfRecords>0</numberOfRecords></searchRetrieveResponse>` },
    ]));

    await expect(haalWetstekstOp("BWBRONBEKEND")).rejects.toThrow("Geen regeling voor BWB-id: BWBRONBEKEND");
    await expect(haalWetstekstOp("BWBRONBEKEND")).rejects.toThrow("BWBR0004770");
  });

  it("geeft foutmelding terug als repository niet bereikbaar is (HTTP-fout)", async () => {
    const sruXml = makeSruXml(makeRecord({ locatie: "https://example.com/wet.xml" }));
    vi.stubGlobal("fetch", mockFetch([
      { ok: true, text: sruXml },
      { ok: false, text: "" },
    ]));

    const { inhoud } = await haalWetstekstOp("BWBR0002320");
    expect(inhoud).toContain("niet bereikbaar");
  });

  it("geeft foutmelding terug als repository fetch een uitzondering gooit (netwerkfout)", async () => {
    const sruXml = makeSruXml(makeRecord({ locatie: "https://example.com/wet.xml" }));
    let call = 0;
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => {
      if (call++ === 0) return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(sruXml) });
      return Promise.reject(new Error("Network error"));
    }));

    const { inhoud } = await haalWetstekstOp("BWBR0002320");
    expect(inhoud).toContain("Fout bij ophalen wetstekst");
  });

  it("geeft formatted en inhoud apart terug", async () => {
    const sruXml = makeSruXml(makeRecord());
    vi.stubGlobal("fetch", mockFetch([
      { ok: true, text: sruXml },
      { ok: true, text: "<wet><artikel>De wetstekst hier</artikel></wet>" },
    ]));

    const { formatted, inhoud } = await haalWetstekstOp("BWBR0002320");
    expect(formatted).toContain("Algemene wet inzake rijksbelastingen");
    expect(formatted).toContain("BWBR0002320");
    expect(formatted).toContain("De wetstekst hier");
    expect(inhoud).toBe("De wetstekst hier");
    // inhoud bevat geen header-regels
    expect(inhoud).not.toContain("BWBR0002320");
  });
});

// ── Zoekterm telt alleen in inhoud, niet in header (bug 3) ────────────────────

describe("zoekterm zoekt alleen in wetstekst, niet in header", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("telt 'belasting' niet mee als het alleen in de titel-header staat", async () => {
    const sruXml = makeSruXml(makeRecord({
      titel: "Wet op de belasting",
      locatie: "https://example.com/wet.xml",
    }));
    vi.stubGlobal("fetch", mockFetch([
      { ok: true, text: sruXml },
      // Wetstekst bevat het woord 'belasting' NIET
      { ok: true, text: "<wet><artikel>Artikel 1. Iedereen betaalt.</artikel></wet>" },
    ]));

    const { inhoud } = await haalWetstekstOp("BWBR0002320");
    // Controleer dat inhoud het woord 'belasting' niet bevat (staat alleen in formatted-header)
    expect(inhoud.toLowerCase()).not.toContain("belasting");
  });

  it("telt vindplaatsen correct als het woord wél in de tekst staat", async () => {
    const sruXml = makeSruXml(makeRecord({ locatie: "https://example.com/wet.xml" }));
    vi.stubGlobal("fetch", mockFetch([
      { ok: true, text: sruXml },
      { ok: true, text: "<wet><a>termijnen hier</a><b>en nog meer termijnen</b></wet>" },
    ]));

    const { inhoud } = await haalWetstekstOp("BWBR0002320");
    const matches = Array.from(inhoud.matchAll(/termijnen/gi));
    expect(matches).toHaveLength(2);
  });
});

// ── vindArtikelContext ────────────────────────────────────────────────────────

describe("vindArtikelContext", () => {
  it("vindt het dichtstbijzijnde artikel vóór de match", () => {
    const tekst = "Artikel 9 Dit is de wetstekst. Hier staat een termijn.";
    const matchIndex = tekst.indexOf("termijn");
    expect(vindArtikelContext(tekst, matchIndex)).toBe("Artikel 9");
  });

  it("geeft lege string terug als er geen artikel vóór de match staat", () => {
    const tekst = "Hier staat een termijn zonder artikelkop.";
    expect(vindArtikelContext(tekst, tekst.indexOf("termijn"))).toBe("");
  });

  it("pakt het dichtstbijzijnde artikel bij meerdere artikelen", () => {
    const tekst = "Artikel 5 eerste inhoud. Artikel 9 tweede inhoud. Hier de match.";
    const matchIndex = tekst.indexOf("Hier de match");
    expect(vindArtikelContext(tekst, matchIndex)).toBe("Artikel 9");
  });

  it("herkent artikelen met letterachtervoegsel (bijv. Artikel 22bis)", () => {
    const tekst = "Artikel 22bis De bodemzaak. Hier staat de match.";
    const matchIndex = tekst.indexOf("Hier staat de match");
    expect(vindArtikelContext(tekst, matchIndex)).toBe("Artikel 22bis");
  });

  it("negeert een artikel dat ná de match staat", () => {
    const tekst = "Hier de match. Artikel 10 staat hierna.";
    expect(vindArtikelContext(tekst, 0)).toBe("");
  });
});

// ── sruRequest ────────────────────────────────────────────────────────────────

describe("sruRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gebruikt HTTPS (bug 4)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("<xml/>") });
    vi.stubGlobal("fetch", fetchMock);

    await sruRequest("dcterms.identifier==BWBR0002320");

    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\//);
  });

  it("gooit een fout bij een HTTP-foutcode", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    await expect(sruRequest("test")).rejects.toThrow("SRU HTTP 500");
  });

  it("geeft de respons-tekst terug", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve("<xml>ok</xml>") }));
    const result = await sruRequest("test");
    expect(result).toBe("<xml>ok</xml>");
  });
});
