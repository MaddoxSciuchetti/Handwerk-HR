/** Exercise the real native renderer and inspect PDF coordinates (no renderer mocks). */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { renderStyledDocumentPdf } from "../src/services/documentPdfNative";
import { fromSegments, type DocumentNode } from "../../shared/document";

const fixture = JSON.parse(
  await readFile(
    "test-fixtures/pdf-goldens/arbeitsvertrag-blanco/input.json",
    "utf8",
  ),
);
const assets = await Promise.all(
  [
    ["Calibri.ttf", "Carlito-Regular.ttf"],
    ["Calibri-Bold.ttf", "Carlito-Bold.ttf"],
  ].map(async ([filename, file]) => ({
    filename: filename!,
    bytes: await readFile(`document-fonts/${file}`),
  })),
);
const document = fromSegments([]);
document.page = {
  ...document.page,
  fontFamily: "Calibri",
  fontSize: 10,
  marginTop: 25,
  marginBottom: 25,
};
const p = (text: string): DocumentNode => ({
  type: "paragraph",
  attrs: { lineHeight: 1, marginBottom: 0 },
  content: [{ type: "text", text }],
});
document.content = {
  type: "doc",
  content: [
    p("Alpha"),
    {
      type: "paragraph",
      attrs: {
        fontSize: 10,
        lineHeight: 1,
        marginBottom: 0,
        preserveEmpty: true,
      },
    },
    p("Beta"),
    {
      type: "paragraph",
      attrs: { lineHeight: 1, marginBottom: 0 },
      content: [
        { type: "text", text: "RuleStart" },
        {
          type: "text",
          text: "\u00a0\u00a0",
          marks: [
            {
              type: "textStyle",
              attrs: { blankUnderlineWidth: 72, color: "#ff0000" },
            },
            { type: "underline" },
          ],
        },
        { type: "text", text: "RuleEnd" },
      ],
    },
    {
      type: "paragraph",
      attrs: { textAlign: "right", lineHeight: 1, marginBottom: 0 },
      content: [
        {
          type: "text",
          text: "\u00a0\u00a0",
          marks: [
            { type: "textStyle", attrs: { blankUnderlineWidth: 92 } },
            { type: "underline" },
          ],
        },
        { type: "text", text: "Euro" },
      ],
    },
    {
      type: "lineGroup",
      attrs: {
        height: 30,
        labels: [
          {
            left: 150,
            top: 0,
            centered: true,
            fontSize: 10,
            runs: [
              { text: "WIDE", props: { fontSize: 20 } },
              { text: "i", props: { fontSize: 6 } },
            ],
          },
        ],
      },
    },
    {
      type: "paragraph",
      attrs: { lineHeight: 1, marginBottom: 0 },
      content: [
        { type: "documentField", attrs: { key: "name", fieldType: "text" } },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "☐ OptionA ☒ OptionB",
          marks: [{ type: "textStyle", attrs: { fontSize: 10 } }],
        },
      ],
    },
  ],
};
document.header = {
  type: "doc",
  content: [fixture.document.header.content[0]],
};
document.footer = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Page " },
        { type: "pageField", attrs: { kind: "page" } },
        { type: "text", text: "/" },
        { type: "pageField", attrs: { kind: "pages" } },
      ],
    },
  ],
};

for (const name of ["Short", "A substantially longer replacement value"]) {
  const bytes = await renderStyledDocumentPdf(
    document,
    { name },
    { assets, familyMap: {} },
  );
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
  });
  try {
    const pdf = await task.promise;
    assert.equal(pdf.numPages, 1);
    const page = await pdf.getPage(1);
    const text = await page.getTextContent();
    const items = text.items.filter(
      (item): item is Extract<typeof item, { str: string }> => "str" in item,
    );
    const find = (value: string) => {
      const item = items.find((item) => item.str === value);
      assert.ok(item, `Expected text is missing: ${value}`);
      return item;
    };
    const alpha = find("Alpha"),
      beta = find("Beta");
    const beforeRule = find("RuleStart"),
      afterRule = find("RuleEnd");
    assert.ok(
      Math.abs(
        afterRule.transform[4]! -
          beforeRule.transform[4]! -
          beforeRule.width -
          72,
      ) < 0.1,
      "Inline fill-in rules must retain their exact authored width",
    );
    assert.ok(
      alpha.height > 9.8 && alpha.height < 10,
      "Inherited font size must retain print scale",
    );
    assert.ok(
      Math.abs(alpha.transform[5]! - beta.transform[5]! - alpha.height * 2) <
        0.3,
      "A preserved blank line must retain a complete line box",
    );
    const label = items.filter(
      (item) => item.str === "WIDE" || item.str === "i",
    );
    assert.equal(label.length, 2);
    const left = Math.min(...label.map((item) => item.transform[4]!));
    const right = Math.max(
      ...label.map((item) => item.transform[4]! + item.width),
    );
    const expectedCenter = (document.page.marginLeft * 72) / 25.4 + 150;
    assert.ok(
      Math.abs((left + right) / 2 - expectedCenter) < 0.5,
      "Mixed-size labels must be centered by actual width",
    );
    assert.ok(
      items.some((item) => item.str.includes(name)),
      "Field replacement must preserve supplied values",
    );
    const allText = items.map((item) => item.str).join(" ");
    assert.match(allText, /OptionA/);
    assert.match(allText, /OptionB/);
    assert.match(
      allText.replace(/\s/g, ""),
      /Page1\/1/,
      "Dynamic footer counters must remain visible",
    );
    const footer = items.find((item) => item.str.startsWith("Page"))!;
    assert.ok(
      footer.transform[5]! > 0 && footer.transform[5]! < 90,
      "Footer must stay inside page bounds",
    );
    const operators = await page.getOperatorList();
    for (const width of [72, 92]) {
      assert.ok(
        operators.fnArray.some((op, index) => {
          if (op !== OPS.transform) return false;
          const matrix = operators.argsArray[index] as number[];
          return (
            Math.abs(Math.abs(matrix[0]!) - width) < 0.1 &&
            Math.abs(Math.abs(matrix[3]!) - 0.5) < 0.01
          );
        }),
        `Fill-in rule ${width}pt must actually be painted, including in a right-aligned paragraph`,
      );
    }
    assert.ok(
      operators.fnArray.some((op) => op === OPS.paintImageXObject),
      "Header images must survive native rendering",
    );
  } finally {
    await task.destroy();
  }
}
console.log("Native PDF layout checks passed for both replacement values.");
