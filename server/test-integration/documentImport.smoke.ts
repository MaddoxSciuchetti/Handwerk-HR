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
    "word/document.xml",
    Buffer.from(
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Arbeitszeugnis Müller</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Name</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Jörg</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
    ),
);
const result = await importStyledDocument({
    originalname: "fixture.docx",
    buffer: zip.toBuffer(),
} as Express.Multer.File);
const html = renderNode(result.document.content, {});
assert(html.includes("<strong>Arbeitszeugnis Müller</strong>"));
assert(html.includes("<table>") && html.includes("Jörg"));
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
console.log(
    "DOCX rich-text/table conversion and deterministic PDF-table reconstruction passed.",
);
