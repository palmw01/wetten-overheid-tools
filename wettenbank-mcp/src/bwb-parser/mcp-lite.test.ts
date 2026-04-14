import { describe, it, expect } from "vitest";
import { parseBwb } from "./index.js";

describe("MCP-Lite Transformation", () => {
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<toestand bwb-id="BWBR0024096" inwerkingtreding="2008-01-01">
  <wetgeving>
    <circulaire>
      <circulaire-tekst>
        <circulaire.divisie bwb-ng-variabel-deel="1.1.2">
          <kop>
            <label>Paragraaf</label>
            <nr>1.1.2</nr>
            <titel>Definities</titel>
          </kop>
          <tekst>
            <al>In deze leidraad wordt verstaan onder:</al>
          </tekst>
          <lijst>
            <li>
              <li.nr>a.</li.nr>
              <al>besluit (het): het <extref doc="jci1.3:c:BWBR0004772" label="Uitvoeringsbesluit">Uitvoeringsbesluit</extref>;</al>
            </li>
          </lijst>
        </circulaire.divisie>
      </circulaire-tekst>
    </circulaire>
  </wetgeving>
</toestand>`;

  it("transforms a complex structure to MCP-Lite format", () => {
    const result = parseBwb(sampleXml, "BWBR0024096", "Leidraad Invordering 2008");
    
    expect(result.mcpLite).toHaveLength(1);
    const node = result.mcpLite[0];
    
    expect(node.bwbId).toBe("BWBR0024096");
    expect(node.citeertitel).toBe("Leidraad Invordering 2008");
    expect(node.sectie).toBe("Paragraaf 1.1.2 Definities");
    
    // Check for flattened text and Markdown links
    expect(node.tekst).toContain("In deze leidraad wordt verstaan onder:");
    expect(node.tekst).toContain("a. besluit (het): het [Uitvoeringsbesluit](jci1.3:c:BWBR0004772);");
    
    // Check bronreferentie
    expect(node.bronreferentie).toBe("jci1.3:c:BWBR0024096&artikel=1.1.2");
  });

  it("handles tables in MCP-Lite format", () => {
    const tableXml = `<?xml version="1.0" encoding="UTF-8"?>
<toestand bwb-id="BWBR12345">
  <wetgeving>
    <wettekst>
      <artikel>
        <kop><nr>1</nr></kop>
        <table>
          <tgroup cols="2">
            <thead>
              <row>
                <entry>Header 1</entry>
                <entry>Header 2</entry>
              </row>
            </thead>
            <tbody>
              <row>
                <entry>Value 1</entry>
                <entry>Value 2</entry>
              </row>
            </tbody>
          </tgroup>
        </table>
      </artikel>
    </wettekst>
  </wetgeving>
</toestand>`;

    const result = parseBwb(tableXml, "BWBR12345", "Test Wet");
    const node = result.mcpLite[0];
    
    expect(node.tekst).toContain("| Header 1 | Header 2 |");
    expect(node.tekst).toContain("| --- | --- |");
    expect(node.tekst).toContain("| Value 1 | Value 2 |");
  });

  it("handles nested lists with indentation", () => {
     const nestedListXml = `<?xml version="1.0" encoding="UTF-8"?>
<toestand bwb-id="BWBR12345">
  <wetgeving>
    <wettekst>
      <artikel>
        <kop><nr>1</nr></kop>
        <lijst>
          <li>
            <li.nr>1.</li.nr>
            <al>Buitenste item</al>
            <lijst>
              <li>
                <li.nr>a.</li.nr>
                <al>Binnenste item</al>
              </li>
            </lijst>
          </li>
        </lijst>
      </artikel>
    </wettekst>
  </wetgeving>
</toestand>`;

    const result = parseBwb(nestedListXml, "BWBR12345", "Test Wet");
    const node = result.mcpLite[0];
    
    expect(node.tekst).toContain("1. Buitenste item");
    expect(node.tekst).toContain("  a. Binnenste item");
  });

  it("handles multiple lids correctly", () => {
    const multiLidXml = `<?xml version="1.0" encoding="UTF-8"?>
<toestand bwb-id="BWBR12345">
  <wetgeving>
    <wettekst>
      <artikel>
        <kop><nr>1</nr></kop>
        <lid><lidnr>1</lidnr><al>Lid 1 tekst</al></lid>
        <lid><lidnr>2</lidnr><al>Lid 2 tekst</al></lid>
      </artikel>
    </wettekst>
  </wetgeving>
</toestand>`;

    const result = parseBwb(multiLidXml, "BWBR12345", "Test Wet");
    expect(result.mcpLite).toHaveLength(2);
    expect(result.mcpLite[0].sectie).toContain("Lid 1");
    expect(result.mcpLite[1].sectie).toContain("Lid 2");
  });
});
