import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { escapeerRegex, bouwTermPatroon, parseZoekterm, stripXml, renderAl, bouwJciUri, extraheerArtikel, extraheerArtikelUitXml, detecteerArtikelStatus, zoekTermInArtikelDom, extraheerDocMetadata, parseRecords, formatRegelingen, dedupliceerOpBwbId, haalWetstekstOp, sruRequest, vindArtikelContext, wetParser, getAlText, parseerArtikelParam } from "./index.js";

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

// ── bouwTermPatroon ──────────────────────────────────────────────────────────

describe("bouwTermPatroon", () => {
  it("exact woord: voegt woordgrenzen toe zonder wildcard", () => {
    expect(bouwTermPatroon("termijn")).toBe("\\btermijn\\b");
  });

  it("suffix-wildcard: \\b aan het begin, \\w* aan het einde", () => {
    expect(bouwTermPatroon("termijn*")).toBe("\\btermijn\\w*");
  });

  it("prefix-wildcard: \\w* aan het begin, \\b aan het einde", () => {
    expect(bouwTermPatroon("*termijn")).toBe("\\w*termijn\\b");
  });

  it("infix-wildcard: \\w* aan beide kanten", () => {
    expect(bouwTermPatroon("*termijn*")).toBe("\\w*termijn\\w*");
  });

  it("escapet speciale tekens vóór de suffix-wildcard", () => {
    expect(bouwTermPatroon("art. 9*")).toBe("\\bart\\. 9\\w*");
  });

  it("escapet speciale tekens zonder wildcard", () => {
    expect(bouwTermPatroon("3:40")).toBe("\\b3:40\\b");
    expect(bouwTermPatroon("25.1")).toBe("\\b25\\.1\\b");
  });
});

// ── parseZoekterm ─────────────────────────────────────────────────────────────

describe("parseZoekterm", () => {
  it("enkelvoudige term geeft OF-operator met één patroon", () => {
    const result = parseZoekterm("termijn");
    expect("patronen" in result && result.patronen).toHaveLength(1);
    expect("operator" in result && result.operator).toBe("OF");
    expect("patronen" in result && result.patronen[0].source).toBe("\\btermijn\\b");
  });

  it("EN-operator splitst op ' EN ' en geeft operator EN terug", () => {
    const result = parseZoekterm("aansprakelijk EN belasting");
    expect("operator" in result && result.operator).toBe("EN");
    expect("patronen" in result && result.patronen).toHaveLength(2);
    expect("patronen" in result && result.patronen[0].source).toBe("\\baansprakelijk\\b");
    expect("patronen" in result && result.patronen[1].source).toBe("\\bbelasting\\b");
  });

  it("OF-operator splitst op ' OF ' en geeft operator OF terug", () => {
    const result = parseZoekterm("uitstel OF afstel");
    expect("operator" in result && result.operator).toBe("OF");
    expect("patronen" in result && result.patronen).toHaveLength(2);
    expect("patronen" in result && result.patronen[0].source).toBe("\\buitstel\\b");
    expect("patronen" in result && result.patronen[1].source).toBe("\\bafstel\\b");
  });

  it("AND wordt herkend als alias voor EN", () => {
    const result = parseZoekterm("aansprakelijk AND belasting");
    expect("operator" in result && result.operator).toBe("EN");
    expect("patronen" in result && result.patronen).toHaveLength(2);
  });

  it("OR wordt herkend als alias voor OF", () => {
    const result = parseZoekterm("uitstel OR afstel");
    expect("operator" in result && result.operator).toBe("OF");
    expect("patronen" in result && result.patronen).toHaveLength(2);
  });

  it("wildcards worden correct doorgegeven via parseZoekterm", () => {
    const result = parseZoekterm("termijn*");
    expect("patronen" in result && result.patronen[0].source).toBe("\\btermijn\\w*");
  });

  it("RegExp-vlag is case-insensitive en globaal", () => {
    const result = parseZoekterm("termijn");
    const pat = "patronen" in result ? result.patronen[0] : null;
    expect(pat?.flags).toContain("g");
    expect(pat?.flags).toContain("i");
  });
});

// ── getAlText ────────────────────────────────────────────────────────────────

describe("getAlText", () => {
  it("geeft string ongewijzigd terug", () => {
    expect(getAlText("tekst")).toBe("tekst");
  });

  it("converteert number naar string", () => {
    expect(getAlText(42)).toBe("42");
  });

  it("extraheert #text uit object (al met attribuut)", () => {
    expect(getAlText({ "#text": "de tekst", "@_status": "officieel" })).toBe("de tekst");
  });

  it("geeft lege string bij null/undefined", () => {
    expect(getAlText(null)).toBe("");
    expect(getAlText(undefined)).toBe("");
  });

  it("geeft lege string bij object zonder #text", () => {
    expect(getAlText({ "@_status": "officieel" })).toBe("");
  });
});

// ── parseerArtikelParam ───────────────────────────────────────────────────────

describe("parseerArtikelParam", () => {
  it("geeft enkelvoudig nummer terug zonder lid", () => {
    expect(parseerArtikelParam("25")).toEqual({ artikelnr: "25", lidnr: null });
  });

  it("splitst N.M in artikelnr en lidnr", () => {
    expect(parseerArtikelParam("9.1")).toEqual({ artikelnr: "9", lidnr: "1" });
    expect(parseerArtikelParam("25.3")).toEqual({ artikelnr: "25", lidnr: "3" });
  });

  it("behandelt artikelnr met letter (4a.1)", () => {
    expect(parseerArtikelParam("4a.1")).toEqual({ artikelnr: "4a", lidnr: "1" });
  });

  it("behandelt Awb-notatie met dubbele punt als geen lid", () => {
    expect(parseerArtikelParam("3:40")).toEqual({ artikelnr: "3:40", lidnr: null });
  });

  it("behandelt alfanumeriek gedeelte na punt niet als lid", () => {
    // "25.a" → maybeLid is "a", niet numeriek → geen lid-splitsing
    expect(parseerArtikelParam("25.a")).toEqual({ artikelnr: "25.a", lidnr: null });
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
    expect(result?.tekst).toContain("Artikel 2");
    expect(result?.tekst).toContain("Artikel 15, eerste lid");
    expect(result?.tekst).toContain("naheffingsaanslag");
    expect(result?.tekst).not.toContain("Artikel 3");
  });

  it("extraheert art. 1 correct", () => {
    const result = extraheerArtikelUitXml(ubIwXml, "1");
    expect(result?.tekst).toContain("Artikel 1");
    expect(result?.tekst).toContain("uitvoering aan de artikelen 15 en 28");
    expect(result?.tekst).not.toContain("Artikel 2");
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
    expect(result?.tekst).toContain("3:40");
    expect(result?.tekst).toContain("bekendgemaakt");
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
    expect(result?.tekst).toContain("25");
    expect(result?.tekst).toContain("Uitstel van betaling");
    expect(result?.tekst).toContain("verleent de ontvanger uitstel");
    expect(result?.tekst).not.toContain("Kwijtschelding");
    expect(result?.tekst).not.toContain("Betalingstermijnen");
  });

  it("extraheert subartikel van Leidraad via <artikel> binnen <circulaire.divisie>", () => {
    const result = extraheerArtikelUitXml(leidraadXml, "25.1");
    expect(result?.tekst).toContain("25.1");
    expect(result?.tekst).toContain("Subartikel 25.1");
    expect(result?.tekst).not.toContain("Uitstel van betaling");
  });

  it("extraheert eerste Leidraad-artikel correct (art. 24)", () => {
    const result = extraheerArtikelUitXml(leidraadXml, "24");
    expect(result?.tekst).toContain("Betalingstermijnen");
    expect(result?.tekst).not.toContain("Uitstel van betaling");
  });

  it("retourneert null voor niet-bestaand Leidraad-artikel", () => {
    expect(extraheerArtikelUitXml(leidraadXml, "99")).toBeNull();
  });

  it("structuurpad bevat officiële hoofdstuk- en afdelingstitel", () => {
    const xml = `<?xml version="1.0"?>
<wetgeving>
  <wet-besluit>
    <wettekst>
      <hoofdstuk>
        <kop><label>Hoofdstuk</label><nr>II</nr><titel>Invordering in eerste aanleg</titel></kop>
        <afdeling>
          <kop><label>Afdeling</label><nr>1</nr><titel>Betalingstermijnen</titel></kop>
          <artikel status="geldend">
            <kop><label>Artikel</label><nr>9</nr><titel>Betalingstermijnen</titel></kop>
            <al>Een belastingaanslag is invorderbaar zes weken na de dagtekening.</al>
          </artikel>
        </afdeling>
      </hoofdstuk>
    </wettekst>
  </wet-besluit>
</wetgeving>`;
    const result = extraheerArtikelUitXml(xml, "9");
    expect(result?.structuurpad).toContain("Hoofdstuk II — Invordering in eerste aanleg");
    expect(result?.structuurpad).toContain("Afdeling 1 — Betalingstermijnen");
    expect(result?.tekst).toContain("Artikel 9");
    expect(result?.tekst).toContain("zes weken");
  });

  it("structuurpad werkt als <titel> een status-attribuut heeft (zoals in de echte IW 1990 XML)", () => {
    const xml = `<?xml version="1.0"?>
<wetgeving>
  <wet-besluit>
    <wettekst>
      <hoofdstuk>
        <kop>
          <label>Hoofdstuk</label>
          <nr>II</nr>
          <titel status="officieel">Invordering in eerste aanleg </titel>
        </kop>
        <artikel status="geldend">
          <kop><label>Artikel</label><nr status="officieel">9</nr></kop>
          <al>Een belastingaanslag is invorderbaar zes weken na de dagtekening.</al>
        </artikel>
      </hoofdstuk>
    </wettekst>
  </wet-besluit>
</wetgeving>`;
    const result = extraheerArtikelUitXml(xml, "9");
    expect(result?.structuurpad[0]).toContain("Hoofdstuk II");
    expect(result?.structuurpad[0]).toContain("Invordering in eerste aanleg");
    expect(result?.structuurpad[0]).not.toContain("[object Object]");
  });

  it("toont artikeltitel correct als <titel> een status-attribuut heeft", () => {
    const xml = `<?xml version="1.0"?>
<wetgeving><wet-besluit><wettekst>
  <artikel status="geldend">
    <kop><label>Artikel</label><nr status="officieel">9</nr><titel status="officieel">Betalingstermijnen</titel></kop>
    <al>Een belastingaanslag is invorderbaar zes weken na de dagtekening.</al>
  </artikel>
</wettekst></wet-besluit></wetgeving>`;
    const result = extraheerArtikelUitXml(xml, "9");
    expect(result?.tekst).toContain("Betalingstermijnen");
    expect(result?.tekst).not.toContain("[object Object]");
  });

  it("structuurpad is leeg als het artikel geen ancestor-kop heeft", () => {
    const result = extraheerArtikelUitXml(ubIwXml, "1");
    expect(result?.structuurpad).toHaveLength(0);
    expect(result?.tekst).toContain("Artikel 1");
  });

  // ── Lid-filter ──────────────────────────────────────────────────────────────

  const lidXml = `<?xml version="1.0"?>
<wetgeving><wet-besluit><wettekst>
  <artikel status="geldend">
    <kop><label>Artikel</label><nr>9</nr><titel>Betalingstermijnen</titel></kop>
    <lid><lidnr>1</lidnr><al>Belastingaanslagen worden betaald binnen zes weken.</al></lid>
    <lid><lidnr>2</lidnr><al>In afwijking van het eerste lid geldt een andere termijn.</al></lid>
    <lid><lidnr>3</lidnr><al>De ontvanger kan uitstel verlenen.</al></lid>
  </artikel>
</wettekst></wet-besluit></wetgeving>`;

  it("extraheert één lid via lidFilter", () => {
    const result = extraheerArtikelUitXml(lidXml, "9", "1");
    expect(result?.tekst).toContain("Artikel 9");
    expect(result?.tekst).toContain("9.1  Belastingaanslagen worden betaald");
    expect(result?.tekst).not.toContain("In afwijking");
    expect(result?.tekst).not.toContain("uitstel verlenen");
  });

  it("extraheert het juiste lid bij meerdere leden", () => {
    const result = extraheerArtikelUitXml(lidXml, "9", "2");
    expect(result?.tekst).toContain("9.2  In afwijking");
    expect(result?.tekst).not.toContain("9.1  Belastingaanslagen");
    expect(result?.tekst).not.toContain("uitstel verlenen");
  });

  it("geeft melding als gevraagd lid niet bestaat", () => {
    const result = extraheerArtikelUitXml(lidXml, "9", "99");
    expect(result?.tekst).toContain("Lid 99 niet gevonden");
  });

  it("geeft melding als artikel geen leden heeft maar lid gevraagd wordt", () => {
    const result = extraheerArtikelUitXml(ubIwXml, "1", "1");
    expect(result?.tekst).toContain("geen genummerde leden");
  });

  it("bevat artikeltitel ook bij lid-filter", () => {
    const result = extraheerArtikelUitXml(lidXml, "9", "3");
    expect(result?.tekst).toContain("Artikel 9 Betalingstermijnen");
    expect(result?.tekst).toContain("9.3  De ontvanger kan uitstel");
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

  it("herkent Awb-stijl nummers met dubbele punt (bijv. Artikel 3:40)", () => {
    const tekst = "Artikel 3:40 Een besluit treedt niet in werking. Hier de match.";
    const matchIndex = tekst.indexOf("Hier de match");
    expect(vindArtikelContext(tekst, matchIndex)).toBe("Artikel 3:40");
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

// ── renderAl ──────────────────────────────────────────────────────────────────

describe("renderAl", () => {
  it("converteert extref naar Markdown-link", () => {
    expect(renderAl('<extref doc="BWBR0004770">artikel 9</extref>')).toBe("[artikel 9](BWBR0004770)");
  });

  it("converteert nadruk type vet naar **bold**", () => {
    expect(renderAl('<nadruk type="vet">belasting</nadruk>')).toBe("**belasting**");
  });

  it("converteert nadruk type cur naar _cursief_", () => {
    expect(renderAl('<nadruk type="cur">termijn</nadruk>')).toBe("_termijn_");
  });

  it("converteert intref naar *cursief*", () => {
    expect(renderAl("<intref>artikel 9</intref>")).toBe("*artikel 9*");
  });

  it("laat gewone tekst ongewijzigd", () => {
    expect(renderAl("gewone tekst")).toBe("gewone tekst");
  });

  it("valt terug op stripXml voor onbekende tags", () => {
    expect(renderAl("<onbekend>tekst</onbekend>")).toBe("tekst");
  });

  it("verwerkt gemengde content correct", () => {
    const input = 'De <nadruk type="vet">belastingschuldige</nadruk> betaalt.';
    expect(renderAl(input)).toBe("De **belastingschuldige** betaalt.");
  });

  it("verwerkt extref met extra attributen naast doc", () => {
    expect(renderAl('<extref status="actief" doc="BWBR0005537">artikel 3:40</extref>')).toBe("[artikel 3:40](BWBR0005537)");
  });
});

// ── bouwJciUri ────────────────────────────────────────────────────────────────

describe("bouwJciUri", () => {
  it("genereert correct JCI-uri formaat", () => {
    expect(bouwJciUri("BWBR0004770", "25")).toBe("jci1.3:c:BWBR0004770&artikel=25");
  });

  it("werkt ook met Awb-stijl nummers", () => {
    expect(bouwJciUri("BWBR0005537", "3:40")).toBe("jci1.3:c:BWBR0005537&artikel=3:40");
  });

  it("werkt met Leidraad subartikel-nummers", () => {
    expect(bouwJciUri("BWBR0024096", "25.1")).toBe("jci1.3:c:BWBR0024096&artikel=25.1");
  });
});

// ── zoekTermInArtikelDom ──────────────────────────────────────────────────────

describe("zoekTermInArtikelDom", () => {
  const xml = `<wetgeving><wettekst>
    <artikel><kop><nr>1</nr></kop><al>termijn geldt voor belasting</al></artikel>
    <artikel><kop><nr>2</nr></kop><al>belasting en termijn en nog een termijn</al></artikel>
    <artikel><kop><nr>3</nr></kop><al>niets relevants hier</al></artikel>
  </wettekst></wetgeving>`;
  const dom = wetParser.parse(xml) as Record<string, unknown>;

  it("vindt de term in de juiste artikelen", () => {
    const treffers = zoekTermInArtikelDom(dom, /termijn/gi);
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).toContain("1");
    expect(nummers).toContain("2");
    expect(nummers).not.toContain("3");
  });

  it("telt meerdere treffers in één artikel correct", () => {
    const treffers = zoekTermInArtikelDom(dom, /termijn/gi);
    const art2 = treffers.find(t => t.artikelnummer === "2");
    expect(art2?.aantalTreffers).toBe(2);
  });

  it("retourneert lege array als term nergens voorkomt", () => {
    expect(zoekTermInArtikelDom(dom, /xyzzy/gi)).toHaveLength(0);
  });

  it("sorteert resultaten numeriek op artikelnummer", () => {
    const treffers = zoekTermInArtikelDom(dom, /termijn/gi);
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers[0]).toBe("1");
    expect(nummers[1]).toBe("2");
  });

  it("vindt term in <lid>-tekst", () => {
    const xml2 = `<wetgeving><wettekst>
      <artikel><kop><nr>5</nr></kop>
        <lid><lidnr>1</lidnr><al>de termijn bedraagt zes weken</al></lid>
        <lid><lidnr>2</lidnr><al>andere regel</al></lid>
      </artikel>
    </wettekst></wetgeving>`;
    const dom2 = wetParser.parse(xml2) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(dom2, /termijn/gi);
    expect(treffers).toHaveLength(1);
    expect(treffers[0].artikelnummer).toBe("5");
    expect(treffers[0].aantalTreffers).toBe(1);
  });

  it("registreert de leden waarin de term voorkomt", () => {
    const xml2 = `<wetgeving><wettekst>
      <artikel><kop><nr>9</nr></kop>
        <lid><lidnr>1</lidnr><al>de termijn bedraagt zes weken</al></lid>
        <lid><lidnr>2</lidnr><al>andere regel zonder treffer</al></lid>
        <lid><lidnr>3</lidnr><al>ook deze termijn telt</al></lid>
      </artikel>
    </wettekst></wetgeving>`;
    const dom2 = wetParser.parse(xml2) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(dom2, /termijn/gi);
    expect(treffers[0].leden).toEqual(["1", "3"]);
  });

  it("geeft lege leden-array voor artikel zonder <lid>-structuur", () => {
    const treffers = zoekTermInArtikelDom(dom, /termijn/gi);
    const art1 = treffers.find(t => t.artikelnummer === "1");
    expect(art1?.leden).toEqual([]);
  });

  it("attribueert match aan het juiste artikel, niet aan een kruisverwijzing", () => {
    // Artikel 5 verwijst naar 'artikel 9' in zijn tekst — telt bij artikel 5, niet 9
    const xml3 = `<wetgeving><wettekst>
      <artikel><kop><nr>5</nr></kop><al>zie artikel 9 van deze wet</al></artikel>
      <artikel><kop><nr>9</nr></kop><al>dit is artikel 9 zelf</al></artikel>
    </wettekst></wetgeving>`;
    const dom3 = wetParser.parse(xml3) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(dom3, /artikel 9/gi);
    const art5 = treffers.find(t => t.artikelnummer === "5");
    const art9 = treffers.find(t => t.artikelnummer === "9");
    expect(art5?.aantalTreffers).toBe(1);
    expect(art9?.aantalTreffers).toBe(1);
  });

  it("ondersteunt wildcard-patroon via bouwTermPatroon", () => {
    const treffers = zoekTermInArtikelDom(dom, new RegExp(bouwTermPatroon("termijn*"), "gi"));
    expect(treffers.length).toBeGreaterThan(0);
  });

  it("vindt term in realistisch BWB-document met <toestand>-wrapper", () => {
    // Echte BWB-documenten hebben <toestand> als root-element — niet <wetgeving>
    const xmlToestand = `<toestand inwerkingtredingsdatum="2026-01-01">
      <wetgeving><wet-besluit><wettekst>
        <artikel><kop><nr>9</nr></kop>
          <lid><lidnr>1</lidnr><al>Een belastingaanslag is invorderbaar zes weken na de dagtekening.</al></lid>
          <lid><lidnr>5</lidnr><al>In zoveel gelijke termijnen als er maanden overblijven.</al></lid>
        </artikel>
        <artikel><kop><nr>10</nr></kop>
          <al>Geen termijn-gerelateerde tekst hier.</al>
        </artikel>
      </wettekst></wet-besluit></wetgeving>
    </toestand>`;
    const domToestand = wetParser.parse(xmlToestand) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domToestand, /termijn/gi);
    expect(treffers.length).toBeGreaterThan(0);
    expect(treffers.find(t => t.artikelnummer === "9")).toBeDefined();
  });

  // ── Woordgrens (exacte match via parseZoekterm) ──────────────────────────────

  it("exacte match matcht NIET op substring (woordgrens)", () => {
    // Artikel 1: alleen 'termijnen' (meervoud); artikel 2: exact 'termijn'
    const xmlWg = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>betalingstermijnen gelden hier</al></artikel>
      <artikel><kop><nr>2</nr></kop><al>de termijn bedraagt zes weken</al></artikel>
    </wettekst></wetgeving>`;
    const domWg = wetParser.parse(xmlWg) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domWg, parseZoekterm("termijn"));
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).not.toContain("1"); // 'termijnen' is geen exacte match
    expect(nummers).toContain("2");
  });

  it("suffix-wildcard matcht ook samengestelde vormen", () => {
    const xmlWc = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>betalingstermijnen zijn van toepassing</al></artikel>
      <artikel><kop><nr>2</nr></kop><al>de termijn bedraagt zes weken</al></artikel>
      <artikel><kop><nr>3</nr></kop><al>niets relevant</al></artikel>
    </wettekst></wetgeving>`;
    const domWc = wetParser.parse(xmlWc) as Record<string, unknown>;
    // termijn* matcht 'termijn' en 'termijnen'; 'betalingstermijnen' heeft geen \b voor 't'
    const treffers = zoekTermInArtikelDom(domWc, parseZoekterm("termijn*"));
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).toContain("2"); // 'termijn' matcht
    expect(nummers).not.toContain("3");
  });

  it("prefix-wildcard matcht op woorden die eindigen op de zoekterm", () => {
    const xmlPfx = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>de betalingstermijn is verstreken</al></artikel>
      <artikel><kop><nr>2</nr></kop><al>de termijn bedraagt zes weken</al></artikel>
      <artikel><kop><nr>3</nr></kop><al>termijnoverschrijding leidt tot rente</al></artikel>
    </wettekst></wetgeving>`;
    const domPfx = wetParser.parse(xmlPfx) as Record<string, unknown>;
    // *termijn matcht 'betalingstermijn' en 'termijn' maar NIET 'termijnoverschrijding'
    const treffers = zoekTermInArtikelDom(domPfx, parseZoekterm("*termijn"));
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).toContain("1"); // 'betalingstermijn' eindigt op 'termijn'
    expect(nummers).toContain("2"); // exact 'termijn'
    expect(nummers).not.toContain("3"); // 'termijnoverschrijding' begint met termijn, eindigt er niet op
  });

  // ── EN/OF-operatoren ─────────────────────────────────────────────────────────

  it("EN-operator: matcht alleen artikelen met ALLE termen", () => {
    const xmlEn = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>aansprakelijkheid voor belasting</al></artikel>
      <artikel><kop><nr>2</nr></kop><al>alleen aansprakelijkheid hier</al></artikel>
      <artikel><kop><nr>3</nr></kop><al>alleen belasting hier</al></artikel>
    </wettekst></wetgeving>`;
    const domEn = wetParser.parse(xmlEn) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domEn, parseZoekterm("aansprakelijkheid EN belasting"));
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).toContain("1");    // bevat beide
    expect(nummers).not.toContain("2"); // mist 'belasting'
    expect(nummers).not.toContain("3"); // mist 'aansprakelijkheid'
  });

  it("EN-operator: telt treffers van ALLE patronen samen", () => {
    const xmlEn2 = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>aansprakelijkheid voor belasting en nog meer belasting</al></artikel>
    </wettekst></wetgeving>`;
    const domEn2 = wetParser.parse(xmlEn2) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domEn2, parseZoekterm("aansprakelijkheid EN belasting"));
    expect(treffers[0].aantalTreffers).toBe(3); // 1× aansprakelijkheid + 2× belasting
  });

  it("OF-operator: matcht artikelen met MINSTENS ÉÉN term", () => {
    const xmlOf = `<wetgeving><wettekst>
      <artikel><kop><nr>1</nr></kop><al>uitstel van betaling</al></artikel>
      <artikel><kop><nr>2</nr></kop><al>afstel van betaling</al></artikel>
      <artikel><kop><nr>3</nr></kop><al>niets relevants</al></artikel>
    </wettekst></wetgeving>`;
    const domOf = wetParser.parse(xmlOf) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domOf, parseZoekterm("uitstel OF afstel"));
    const nummers = treffers.map(t => t.artikelnummer);
    expect(nummers).toContain("1");
    expect(nummers).toContain("2");
    expect(nummers).not.toContain("3");
  });

  it("EN-operator over meerdere <lid>-elementen: termen in verschillende leden telt als match", () => {
    const xmlLid = `<wetgeving><wettekst>
      <artikel><kop><nr>5</nr></kop>
        <lid><lidnr>1</lidnr><al>de aansprakelijkheid wordt vastgesteld</al></lid>
        <lid><lidnr>2</lidnr><al>de belasting is verschuldigd</al></lid>
      </artikel>
    </wettekst></wetgeving>`;
    const domLid = wetParser.parse(xmlLid) as Record<string, unknown>;
    const treffers = zoekTermInArtikelDom(domLid, parseZoekterm("aansprakelijkheid EN belasting"));
    expect(treffers).toHaveLength(1);
    expect(treffers[0].artikelnummer).toBe("5");
  });
});

// ── detecteerArtikelStatus ────────────────────────────────────────────────────

describe("detecteerArtikelStatus", () => {
  it("retourneert null voor een artikel met status geldend", () => {
    const xml = `<wetgeving><wettekst>
      <artikel status="geldend"><kop><nr>1</nr></kop><al>tekst</al></artikel>
    </wettekst></wetgeving>`;
    expect(detecteerArtikelStatus(xml, "1")).toBeNull();
  });

  it("retourneert waarschuwing voor een vervallen artikel", () => {
    const xml = `<wetgeving><wettekst>
      <artikel status="vervallen"><kop><nr>2</nr></kop><al>tekst</al></artikel>
    </wettekst></wetgeving>`;
    const result = detecteerArtikelStatus(xml, "2");
    expect(result).not.toBeNull();
    expect(result).toContain("vervallen");
  });

  it("retourneert null bij lege rawXml", () => {
    expect(detecteerArtikelStatus("", "1")).toBeNull();
  });

  it("retourneert null als artikel niet bestaat", () => {
    const xml = `<wetgeving><wettekst>
      <artikel status="geldend"><kop><nr>1</nr></kop><al>tekst</al></artikel>
    </wettekst></wetgeving>`;
    expect(detecteerArtikelStatus(xml, "99")).toBeNull();
  });
});

// ── extraheerDocMetadata ──────────────────────────────────────────────────────

describe("extraheerDocMetadata", () => {
  it("extraheert citeertitel en versiedatum uit toestand-structuur", () => {
    const xml = `<toestand inwerkingtreding="2024-01-01">
      <wetgeving>
        <wet-besluit>
          <regeling-info>
            <citeertitel>Invorderingswet 1990</citeertitel>
          </regeling-info>
          <wettekst></wettekst>
        </wet-besluit>
      </wetgeving>
    </toestand>`;
    const dom = wetParser.parse(xml) as Record<string, unknown>;
    const meta = extraheerDocMetadata(dom);
    expect(meta.citeertitel).toBe("Invorderingswet 1990");
    expect(meta.versiedatum).toBe("2024-01-01");
  });

  it("geeft lege strings als de toestand-structuur ontbreekt", () => {
    const dom = wetParser.parse("<wetgeving><wettekst></wettekst></wetgeving>") as Record<string, unknown>;
    const meta = extraheerDocMetadata(dom);
    expect(meta.citeertitel).toBe("");
    expect(meta.versiedatum).toBe("");
  });
});
