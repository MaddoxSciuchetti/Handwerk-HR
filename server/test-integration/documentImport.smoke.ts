import assert from "node:assert/strict";
import AdmZip from "adm-zip";
import {
  importStyledDocument,
  reconstructLines,
} from "../src/services/importStyledDocument";
import { renderNode } from "../../shared/documentRendering";

const zip = new AdmZip();
zip.addFile(
  "[Content_Types].xml",
  Buffer.from(
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
  ),
);
zip.addFile(
  "_rels/.rels",
  Buffer.from(
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
  ),
);
zip.addFile(
  "word/styles.xml",
  Buffer.from(
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Base"><w:pPr><w:jc w:val="both"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri"/><w:sz w:val="16"/><w:color w:val="215E99"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Body"><w:basedOn w:val="Base"/></w:style></w:styles>',
  ),
);
zip.addFile(
  "word/_rels/document.xml.rels",
  Buffer.from(
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="numbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>',
  ),
);
zip.addFile(
  "word/numbering.xml",
  Buffer.from(
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>',
  ),
);
zip.addFile(
  "word/document.xml",
  Buffer.from(
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Body"/></w:pPr><w:r><w:rPr><w:b/></w:rPr><w:t>Arbeitszeugnis Müller</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Body"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:rPr><w:color w:val="EE0000"/></w:rPr><w:t>First task</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Body"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr><w:r><w:t>Second task</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Name</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Jörg</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
  ),
);
// Pages exports numbering through numStyleLink indirection, not always inline.
zip.addFile(
  "word/styles.xml",
  Buffer.from(
    zip
      .readAsText("word/styles.xml")
      .replace(
        "</w:styles>",
        '<w:style w:type="numbering" w:styleId="Imported"><w:pPr><w:numPr><w:numId w:val="3"/></w:numPr></w:pPr></w:style></w:styles>',
      ),
  ),
);
zip.addFile(
  "word/numbering.xml",
  Buffer.from(
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:numStyleLink w:val="Imported"/></w:abstractNum><w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="3"><w:abstractNumId w:val="2"/></w:num></w:numbering>',
  ),
);
const result = await importStyledDocument({
  originalname: "fixture.docx",
  buffer: zip.toBuffer(),
} as Express.Multer.File);
const html = renderNode(result.document.content, {});
assert(
  result.document.content.content?.[0].content?.[0].marks?.some(
    (mark) => mark.type === "bold",
  ),
);
assert(html.includes("Arbeitszeugnis Müller"));
assert(html.includes("<table>") && html.includes("Jörg"));
assert(html.includes("text-align:justify"));
assert(html.includes("font-family:Calibri;font-size:8pt;color:#215e99"));
assert(html.includes("color:#ee0000"));
assert.equal((html.match(/<li/g) ?? []).length, 2);
assert(
  result.document.content.content
    ?.find((node) => node.type === "bulletList")
    ?.content?.every((item) => item.content?.[0].type === "paragraph"),
);
const table = reconstructLines(
  [
    {
      text: "Name",
      x: 50,
      y: 700,
      width: 25,
      size: 11,
      font: "Calibri-Bold",
    },
    { text: "Jörg", x: 250, y: 700, width: 25, size: 11, font: "Calibri" },
    { text: "Datum", x: 50, y: 685, width: 25, size: 11, font: "Calibri" },
    {
      text: "09.10.2026",
      x: 250,
      y: 685,
      width: 55,
      size: 11,
      font: "Calibri",
    },
  ],
  595,
);
assert.equal(table[0].type, "table");
zip.addFile(
  "word/numbering.xml",
  Buffer.from(
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="none"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="4"/></w:lvlOverride></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>',
  ),
);
const paragraph = (id: number, text: string) =>
  `<w:p><w:pPr><w:jc w:val="left"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="${id}"/></w:numPr></w:pPr><w:r><w:t>${text}</w:t></w:r></w:p>`;
zip.addFile(
  "word/document.xml",
  Buffer.from(
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' +
      paragraph(1, "Fourth clause") +
      paragraph(2, "Not a bullet") +
      paragraph(1, "Fifth clause") +
      "</w:body></w:document>",
  ),
);
const numberingResult = await importStyledDocument({
  originalname: "numbering.docx",
  buffer: zip.toBuffer(),
} as Express.Multer.File);
const blocks = numberingResult.document.content.content!;
assert.equal(blocks[0].attrs?.start, 4);
assert.equal(blocks[1].type, "paragraph");
assert.equal(blocks[1].attrs?.textAlign, "left");
assert.equal(blocks[2].attrs?.start, 5);
assert(renderNode(numberingResult.document.content, {}).includes('start="5"'));
zip.addFile(
  "word/document.xml",
  Buffer.from(
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Before section</w:t></w:r></w:p><w:p><w:pPr><w:sectPr><w:type w:val="nextPage"/></w:sectPr></w:pPr></w:p><w:p><w:r><w:t>After section</w:t></w:r></w:p></w:body></w:document>',
  ),
);
const sectionResult = await importStyledDocument({
  originalname: "sections.docx",
  buffer: zip.toBuffer(),
} as Express.Multer.File);
assert.deepEqual(
  sectionResult.document.content.content?.map((node) => node.type),
  ["paragraph", "pageBreak", "paragraph"],
);
zip.addFile(
  "word/document.xml",
  Buffer.from(
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body>
        <w:p><w:pPr><w:ind w:left="400"/></w:pPr><w:r><w:t>Before rule</w:t></w:r></w:p>
        <w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="2400"/><w:tab w:val="left" w:pos="4400"/></w:tabs><w:ind w:left="200"/></w:pPr><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:tab/></w:r><w:r><w:t> den </w:t></w:r><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:tab/></w:r></w:p>
        <w:p><w:pPr><w:spacing w:before="200"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:drawing><wp:anchor><wp:positionH relativeFrom="page"><wp:posOffset>1270000</wp:posOffset></wp:positionH><wp:positionV relativeFrom="line"><wp:posOffset>254000</wp:posOffset></wp:positionV><wp:extent cx="2540000" cy="0"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:prstGeom prst="line"/><a:ln w="6350"><a:solidFill><a:srgbClr val="215E99"/></a:solidFill></a:ln></wps:spPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="600" w:firstLine="200"/></w:pPr><w:r><w:t>After rule</w:t></w:r></w:p>
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`,
  ),
);
const layoutResult = await importStyledDocument({
  originalname: "layout.docx",
  buffer: zip.toBuffer(),
} as Express.Multer.File);
const layout = layoutResult.document.content.content!;
assert.deepEqual(
  layout.map((node) => node.type),
  ["paragraph", "lineGroup", "lineGroup", "paragraph"],
);
assert.equal(layout[0].attrs?.marginLeft, 20);
assert.equal(layout[1].attrs?.labels?.[0]?.text, " den ");
assert.equal(layout[3].attrs?.marginLeft, 30);
assert.equal(layout[3].attrs?.textIndent, 10);
const layoutHtml = renderNode(layoutResult.document.content, {});
assert.match(layoutHtml, /width:200pt/);
assert.match(layoutHtml, /> den <\/span>/);
console.log(
  "DOCX inherited styles, colors, lists, numbering, section/layout breaks, tab-stop geometry, anchored rules and deterministic PDF reconstruction passed.",
);
