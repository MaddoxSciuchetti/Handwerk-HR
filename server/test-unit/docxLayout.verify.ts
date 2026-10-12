import assert from "node:assert/strict";
import JSZip from "jszip";
import { importStyledDocument } from "../src/services/importStyledDocument.ts";
import { parseStyledDocument } from "../src/services/styledDocument.ts";
import { renderNode } from "../../shared/documentRendering.ts";
import type { DocumentNode } from "../../shared/document.ts";

const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
  <w:body>
    <w:p>
      <w:pPr><w:tabs><w:tab w:val="left" w:pos="9436"/></w:tabs></w:pPr>
      <w:r><w:t xml:space="preserve">Zwischen         </w:t></w:r>
      <w:r><w:t xml:space="preserve">            </w:t></w:r>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>BSB GmbH</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:ind w:left="300" w:hanging="200"/><w:tabs><w:tab w:val="left" w:pos="7967"/></w:tabs></w:pPr>
      <w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>Westfälische Straße 27</w:t></w:r>
      <w:r><w:tab/></w:r><w:r><w:t>im folgenden Arbeitgeber genannt</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t xml:space="preserve">Seite </w:t></w:r>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="separate"/></w:r>
      <w:r><w:t>1</w:t></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
      <w:r><w:t> von </w:t></w:r>
      <w:r><w:fldChar w:fldCharType="begin"/></w:r>
      <w:r><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r>
      <w:r><w:fldChar w:fldCharType="separate"/></w:r>
      <w:r><w:t>1</w:t></w:r>
      <w:r><w:fldChar w:fldCharType="end"/></w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:pict>
          <v:shape><v:textbox><w:txbxContent>
            <w:p><w:r><w:t>Brutto Zeile</w:t></w:r></w:p>
            <w:p><w:r><w:t>Lohn</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>100 €</w:t></w:r></w:p>
            <w:p><w:r><w:t>Summe</w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:tab/></w:r><w:r><w:t>100 €</w:t></w:r></w:p>
          </w:txbxContent></v:textbox></v:shape>
        </w:pict>
        <w:drawing>
          <wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="1" behindDoc="0" locked="0" layoutInCell="1" allowOverlap="1">
            <wp:extent cx="5892800" cy="1078231"/>
            <a:graphic><a:graphicData>
              <wps:wsp><wps:spPr>
                <a:prstGeom prst="rect"/>
                <a:ln w="6095"><a:solidFill><a:srgbClr val="000000"/></a:solidFill></a:ln>
              </wps:spPr><wps:txbx><w:txbxContent>
                <w:p><w:r><w:t>Brutto Zeile</w:t></w:r></w:p>
                <w:p><w:r><w:t>Lohn</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>100 €</w:t></w:r></w:p>
                <w:p><w:r><w:t>Summe</w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:tab/></w:r><w:r><w:t>100 €</w:t></w:r></w:p>
              </w:txbxContent></wps:txbx></wps:wsp>
            </a:graphicData></a:graphic>
          </wp:anchor>
        </w:drawing>
      </w:r>
    </w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:bottom="1134" w:left="1134" w:right="1134"/></w:sectPr>
  </w:body>
</w:document>`;

const zip = new JSZip();
zip.file(
  "[Content_Types].xml",
  `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
);
zip.file(
  "_rels/.rels",
  `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
);
zip.file("word/document.xml", documentXml);
const buffer = await zip.generateAsync({ type: "nodebuffer" });
const { document } = await importStyledDocument({
  originalname: "sample.docx",
  buffer,
} as Express.Multer.File);
parseStyledDocument(document);
const nodes = document.content.content ?? [];
const text = (node: DocumentNode): string =>
  node.type === "pageField"
    ? String(node.attrs?.kind)
    : (node.text ?? (node.content ?? []).map(text).join(""));
const party = nodes.find((node) => node.type === "lineGroup");
const labels = party?.attrs?.labels as {
  text: string;
  left: number;
  underline?: boolean;
}[];
assert.deepEqual(
  labels.map((label) => label.text),
  ["Zwischen", "BSB GmbH"],
);
assert.equal(labels[0].left, 0);
assert.ok(labels[1].left > labels[0].left);
assert.equal(labels[1].underline, true);
assert.equal((labels[1] as { centered?: boolean }).centered, true);
assert.match(renderNode(party!, {}), /transform:translateX\(-50%\)/);
assert.doesNotMatch(renderNode(party!, {}), /border-top/);
assert.deepEqual(party?.attrs?.lines, []);
const address = nodes.find((node) =>
  text(node).includes("Westfälische Straße"),
);
assert.equal(address?.type, "paragraph");
assert.equal(address?.attrs?.textAlign, "center");
assert.equal(address?.attrs?.marginLeft, 0);
assert.equal(address?.attrs?.textIndent, 0);
assert.equal(
  address?.content?.filter((item) => item.type === "hardBreak").length,
  1,
);
const pages = nodes.find((node) =>
  (node.content ?? []).some((child) => child.type === "pageField"),
);
assert.equal(pages?.attrs?.textAlign, "right");
assert.equal(text(pages!), "Seite page von pages");
const html = renderNode(pages!, {});
assert.match(html, /class="pageNumber"/);
assert.match(html, /class="totalPages"/);
assert.match(html, /text-align:right/);
assert.doesNotMatch(html, />1</);
const table = nodes.find((node) => node.type === "table");
assert.equal(table?.attrs?.border, "box");
assert.equal(table?.content?.length, 3);
assert.match(renderNode(table!, {}), /data-border="box"/);
assert.match(renderNode(table!, {}), /border-bottom:0.5pt solid currentColor/);
assert.match(text(table!.content![1].content![1]), /100 €/);
console.log("docx layout checks passed");

// Real Word footers and simple fields must reach the repeating PDF template.
zip.file(
  "word/footer1.xml",
  `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p>
<w:r><w:t xml:space="preserve">Seite </w:t></w:r>
<w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple>
<w:r><w:t xml:space="preserve"> von </w:t></w:r>
<w:fldSimple w:instr="NUMPAGES"><w:r><w:t>1</w:t></w:r></w:fldSimple>
</w:p><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText>DATE</w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>11.10.2026</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`,
);
const native = await importStyledDocument({
  originalname: "footer.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
parseStyledDocument(native.document);
const pagination = native.document.footer.content?.find((node) =>
  node.content?.some((child) => child.type === "pageField"),
);
assert.equal(text(pagination!), "Seite page von pages");
assert.equal(pagination?.attrs?.textAlign, "right");
assert.ok(
  native.document.footer.content?.some((node) => text(node) === "11.10.2026"),
);
console.log("native footer and cached-field checks passed");

// Word content controls are omitted by Mammoth, and tab rows may already be
// converted to positioned labels when the enclosing text box is reconstructed.
zip.file(
  "word/document.xml",
  documentXml
    .replaceAll(
      "<w:t>Brutto Zeile</w:t></w:r></w:p>",
      "<w:t>Brutto Zeile</w:t></w:r><w:sdt><w:sdtContent><w:r><w:t>☒</w:t></w:r></w:sdtContent></w:sdt></w:p>",
    )
    .replaceAll(
      "<w:p><w:r><w:t>Lohn</w:t>",
      '<w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="4000"/></w:tabs></w:pPr><w:r><w:t>Lohn</w:t>',
    ),
);
const controls = await importStyledDocument({
  originalname: "controls.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const controlledTable = controls.document.content.content?.find(
  (node) => node.type === "table",
);
assert.ok(
  controlledTable,
  "checkbox controls and positioned labels must not prevent table reconstruction",
);
assert.equal(controlledTable.content?.length, 3);
assert.match(text(controlledTable), /☒/);
parseStyledDocument(controls.document);
console.log("Word checkbox and positioned table checks passed");

// An omitted pStyle still uses Word's default paragraph style, and the size
// of a checkbox run must not enlarge the sentence beside it.
zip.file(
  "word/styles.xml",
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:pPrDefault><w:pPr><w:spacing w:after="160"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="22"/></w:rPr></w:style></w:styles>',
);
zip.file(
  "word/document.xml",
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:color w:val="EE0000"/><w:sz w:val="14"/></w:rPr><w:t>Red task</w:t></w:r></w:p><w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="7000"/></w:tabs></w:pPr><w:sdt><w:sdtContent><w:r><w:rPr><w:sz w:val="28"/></w:rPr><w:t>☐</w:t></w:r></w:sdtContent></w:sdt><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t> Contract sentence</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>until</w:t></w:r></w:p></w:body></w:document>',
);
const mixed = await importStyledDocument({
  originalname: "mixed.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
assert.equal(
  mixed.document.content.content?.find((node) => text(node) === "Red task")
    ?.attrs?.marginBottom,
  0,
);
const mixedLabels = mixed.document.content.content?.find(
  (node) => node.type === "lineGroup",
)?.attrs?.labels as {
  text: string;
  fontSize: number;
  runs?: { text: string; props: Record<string, unknown> }[];
}[];
assert.equal(
  mixedLabels[0].runs?.find((run) => run.text === "☐")?.props.fontSize,
  14,
);
assert.equal(
  mixedLabels[0].runs?.find((run) => run.text.includes("Contract sentence"))
    ?.props.fontSize,
  8,
);
assert.match(renderNode(mixed.document.content, {}), /font-size:8pt/);
console.log("Default paragraph spacing and mixed checkbox sizes passed");

// List padding owns the Word marker/text offset. A child paragraph's inherited
// list-style indent must not add another offset or hanging first-line shift.
zip.file(
  "word/numbering.xml",
  '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="424" w:hanging="282"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>',
);
zip.file(
  "word/document.xml",
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="720" w:hanging="300"/></w:pPr><w:r><w:t>A long numbered clause that continues on another line.</w:t></w:r></w:p></w:body></w:document>',
);
const indentation = await importStyledDocument({
  originalname: "numbered-indentation.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const numbered = indentation.document.content.content?.find(
  (node) => node.type === "orderedList",
);
assert.equal(numbered?.attrs?.paddingLeft, 21.2);
const clause = numbered?.content?.[0].content?.[0];
assert.equal(clause?.attrs?.marginLeft, 0);
assert.equal(clause?.attrs?.textIndent, 0);
console.log("Numbered clause indentation checks passed");

// A checkbox choice stored as a paragraph must align with its positioned
// sibling instead of retaining an inherited list-like paragraph offset.
zip.remove("word/numbering.xml");
zip.file(
  "word/document.xml",
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:ind w:left="424"/></w:pPr><w:r><w:t>☒ unbefristet</w:t></w:r></w:p></w:body></w:document>',
);
const choice = await importStyledDocument({
  originalname: "checkbox-alignment.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
assert.equal(choice.document.content.content?.[0].attrs?.marginLeft, 0);
assert.equal(choice.document.content.content?.[0].attrs?.textIndent, 0);
console.log("Checkbox choice left alignment passed");

// Word exports signature rules as thin custom DrawingML paths, followed by
// captions whose tabs must retain their horizontal positions.
const customRule = (x: number) =>
  `<w:r><w:drawing><wp:anchor><wp:positionH relativeFrom="page"><wp:posOffset>${x}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>127000</wp:posOffset></wp:positionV><wp:extent cx="2540000" cy="1270"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:custGeom><a:pathLst><a:path><a:moveTo><a:pt x="0" y="0"/></a:moveTo><a:lnTo><a:pt x="2540000" y="0"/></a:lnTo></a:path></a:pathLst></a:custGeom><a:ln w="6350"/></wps:spPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r>`;
zip.file(
  "word/document.xml",
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body><w:p>${customRule(762000)}${customRule(4064000)}</w:p><w:p><w:pPr><w:jc w:val="center"/><w:tabs><w:tab w:val="left" w:pos="9400"/></w:tabs></w:pPr><w:r><w:t>(Arbeitgeber)</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>(Arbeitnehmer)</w:t></w:r></w:p></w:body></w:document>`,
);
const signatures = await importStyledDocument({
  originalname: "signatures.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const signatureNodes = signatures.document.content.content!;
const rules = signatureNodes.find(
  (n) => n.type === "lineGroup" && (n.attrs?.lines as unknown[])?.length === 2,
)!;
const captions = signatureNodes.find(
  (n) => n.type === "lineGroup" && (n.attrs?.labels as unknown[])?.length === 2,
)!;
assert.ok(rules);
const signatureLabels = captions.attrs!.labels as {
  left: number;
  centered: boolean;
  text: string;
}[];
const signatureRules = rules.attrs!.lines as { left: number; width: number }[];
for (let i = 0; i < 2; i++) {
  assert.equal(signatureLabels[i].centered, true);
  assert.equal(
    signatureLabels[i].left,
    signatureRules[i].left + signatureRules[i].width / 2,
  );
}
console.log("Custom signature lines and horizontal captions passed");

const inlineRule = customRule(0)
  .replace(/<wp:position[HV][\s\S]*?<\/wp:position[HV]>/g, "")
  .replaceAll("wp:anchor", "wp:inline")
  .replace('cx="2540000"', 'cx="1270000"');
zip.file(
  "word/document.xml",
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body><w:p><w:pPr><w:ind w:left="2880"/><w:tabs><w:tab w:pos="5580"/><w:tab w:pos="7750"/><w:tab w:pos="9793"/></w:tabs></w:pPr><w:r><w:t>den</w:t></w:r><w:r><w:tab/></w:r><w:r><w:rPr><w:u/></w:rPr><w:tab/></w:r><w:r><w:t>den</w:t></w:r><w:r><w:rPr><w:u/></w:rPr><w:tab/></w:r></w:p><w:p><w:pPr><w:ind w:left="429"/><w:tabs><w:tab w:pos="3271"/></w:tabs></w:pPr>${inlineRule}<w:r><w:tab/></w:r>${inlineRule}</w:p><w:p><w:pPr><w:tabs><w:tab w:pos="3717"/><w:tab w:pos="6518"/><w:tab w:pos="8821"/></w:tabs></w:pPr><w:r><w:t>(Ort)</w:t><w:tab/><w:t>(Datum)</w:t><w:tab/><w:t>(Ort)</w:t><w:tab/><w:t>(Datum)</w:t></w:r></w:p></w:body></w:document>`,
);
const inlineImport = await importStyledDocument({
  originalname: "inline-signatures.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const combinedRow = inlineImport.document.content.content!.find(
  (n) => (n.attrs?.lines as unknown[])?.length === 4,
)!;
assert.ok(combinedRow);
const denLabels = combinedRow.attrs!.labels as { left: number }[];
assert.equal(denLabels[0].left, 144);
const fourCaptions = inlineImport.document.content.content!.find(
  (n) => (n.attrs?.labels as unknown[])?.length === 4,
)!;
assert.ok(
  (fourCaptions.attrs!.labels as { centered: boolean }[]).every(
    (label) => label.centered,
  ),
);
console.log("Combined inline and tab signature geometry passed");

zip.file(
  "word/document.xml",
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Previous page</w:t></w:r></w:p><w:p><w:r><w:lastRenderedPageBreak/><w:t>Unbefristetes Arbeitsverhältnis</w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Before boundary </w:t><w:lastRenderedPageBreak/><w:t>after boundary.</w:t></w:r></w:p></w:body></w:document>`,
);
const cachedPages = await importStyledDocument({
  originalname: "word-cached-pages.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const cachedNodes = cachedPages.document.content.content!;
assert.equal(cachedNodes.filter((n) => n.type === "pageBreak").length, 2);
const titleIndex = cachedNodes.findIndex((n) =>
  n.content?.some((t) => t.text === "Unbefristetes Arbeitsverhältnis"),
);
assert.equal(cachedNodes[titleIndex - 1].type, "pageBreak");
const beforeIndex = cachedNodes.findIndex((n) =>
  n.content?.some((t) => t.text === "Before boundary "),
);
assert.equal(cachedNodes[beforeIndex + 1].type, "pageBreak");
assert.equal(cachedNodes[beforeIndex + 2].content?.[0].text, "after boundary.");
assert.ok(
  cachedNodes[beforeIndex + 2].content?.[0].marks?.some(
    (mark) => mark.type === "bold",
  ),
);
console.log("Saved Word page boundaries and inline text/marks passed");

// A checkbox row with an underlined date tab must align with a plain choice.
// Signature-row offsets must not push this first label back to the right.
zip.file(
  "word/document.xml",
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:ind w:left="424"/><w:tabs><w:tab w:pos="7000"/><w:tab w:pos="9500"/></w:tabs></w:pPr><w:r><w:rPr><w:sz w:val="28"/></w:rPr><w:t>☐ </w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t>in einem befristeten Arbeitsverhältnis</w:t></w:r><w:r><w:tab/><w:t>bis zum</w:t></w:r><w:r><w:rPr><w:u/></w:rPr><w:tab/></w:r></w:p><w:p><w:pPr><w:ind w:left="424"/></w:pPr><w:r><w:t>☒ in einem unbefristeten Arbeitsverhältnis</w:t></w:r></w:p></w:body></w:document>`,
);
const choicesWithDate = await importStyledDocument({
  originalname: "checkbox-date-alignment.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const pairedChoices = choicesWithDate.document.content.content!;
const firstChoiceRow = pairedChoices.find((n) => n.type === "lineGroup")!;
const secondChoiceRow = pairedChoices.find((n) => n.type === "paragraph")!;
assert.equal((firstChoiceRow.attrs!.labels as { left: number }[])[0].left, 0);
assert.equal(secondChoiceRow.attrs!.marginLeft, 0);
assert.equal((firstChoiceRow.attrs!.lines as unknown[]).length, 1);
assert.match(
  renderNode(firstChoiceRow, {}),
  /position:absolute;white-space:pre;left:0pt/,
);
console.log("Paired checkbox/date row alignment passed");

zip.file(
  "word/numbering.xml",
  '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:pPr><w:ind w:left="422" w:hanging="282"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="16"><w:abstractNumId w:val="0"/></w:num></w:numbering>',
);
zip.file(
  "word/document.xml",
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="16"/></w:numPr><w:tabs><w:tab w:pos="422"/><w:tab w:pos="9793"/></w:tabs><w:ind w:left="422" w:hanging="282"/></w:pPr><w:r><w:t>Frau XXX tritt als Kauffrau für Büromanagement ein.</w:t><w:tab/><w:t xml:space="preserve"> </w:t></w:r></w:p></w:body></w:document>',
);
const firstPoint = await importStyledDocument({
  originalname: "first-point-trailing-tab.docx",
  buffer: await zip.generateAsync({ type: "nodebuffer" }),
} as Express.Multer.File);
const firstPointList = firstPoint.document.content.content!.find(
  (n) => n.type === "orderedList",
)!;
assert.ok(firstPointList);
assert.equal(firstPointList.attrs!.start, 1);
assert.equal(firstPointList.attrs!.color, "#000000");
const firstPointParagraph = firstPointList.content![0].content![0];
assert.equal(firstPointParagraph.type, "paragraph");
assert.notEqual(firstPointParagraph.attrs!.textAlign, "center");
assert.equal(firstPointParagraph.attrs!.marginLeft, 0);
assert.doesNotMatch(
  renderNode(firstPoint.document.content, {}),
  /text-align:center/,
);
console.log("First numbered point with a trailing tab stays left aligned");
