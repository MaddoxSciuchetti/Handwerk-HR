import { filledDocument, fromSegments } from "../../shared/document";
import { DOCUMENT_CSS, renderNode } from "../../shared/documentRendering";
import { normalizeLineLabels } from "../../client/src/features/settings/documents/util/lineLayout.util";
import { parseStyledDocument } from "@/services/styledDocument";

function imported() {
  const document = fromSegments([]);
  document.content = {
    type: "doc",
    content: [
      {
        type: "lineGroup",
        attrs: {
          height: 20,
          lines: [],
          labels: [
            {
              left: 0,
              top: 0,
              fontFamily: "Arial",
              fontSize: 14,
              color: "#000000",
              text: "☐ befristeten Arbeitsverhältnis",
              runs: [
                { text: "☐ ", props: { fontFamily: "Arial", fontSize: 14 } },
                {
                  text: "befristeten Arbeitsverhältnis",
                  props: {
                    fontFamily: "Arial",
                    fontSize: 8,
                    color: "#215e99",
                    bold: true,
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  document.content = normalizeLineLabels(document.content);
  return document;
}

it("accepts the actual client-normalized label model and preserves mixed sizes after editing and saving", () => {
  const document = imported();
  const label = document.content.content![0].content![0];
  label.content![1].text = "befristeten Verhältnis";
  const saved = parseStyledDocument(JSON.parse(JSON.stringify(document)));
  const html = renderNode(saved.content, {});
  expect(html).toContain("befristeten Verhältnis");
  expect(html).toContain("font-size:8pt");
  expect(html).toContain("font-size:14pt");
  expect(html).toContain("#215e99");
  expect(html).not.toContain("ptpt");
});

it("rejects invalid positioned label coordinates and block content", () => {
  const document = imported();
  const label = document.content.content![0].content![0];
  label.attrs!.left = 3000;
  expect(() => parseStyledDocument(document)).toThrow("Linienbeschriftung");
  label.attrs!.left = 0;
  label.content = [{ type: "paragraph" }];
  expect(() => parseStyledDocument(document)).toThrow("Linienbeschriftung");
});

it("preserves a mapped checkbox's glyph, marks and fixed footprint when saving and printing", () => {
  const document = imported();
  const label = document.content.content![0].content![0];
  const marks = label.content![0].marks;
  label.content![0] = {
    type: "documentField",
    attrs: {
      key: "contract.fixed_term",
      label: "Fixed term",
      fieldType: "checkbox",
      required: false,
      checkboxGlyph: "☐",
    },
    marks,
  };
  const saved = parseStyledDocument(JSON.parse(JSON.stringify(document)));
  const field = saved.content.content![0].content![0].content![0];
  expect(field.attrs!.checkboxGlyph).toBe("☐");
  expect(field.marks).toEqual(marks);
  const unchecked = renderNode(saved.content, {
    "contract.fixed_term": "false",
  });
  const checked = renderNode(saved.content, { "contract.fixed_term": "true" });
  expect(unchecked).toContain("☐");
  expect(checked).toContain("☒");
  expect(checked).toContain("visibility:hidden");
  expect(checked).toContain("font-size:14pt");
  expect(checked).not.toContain('class="pdf-checkbox"');
  label.content![0].attrs!.checkboxGlyph = "invalid";
  expect(() => parseStyledDocument(document)).toThrow();
});

it("keeps checkbox geometry in a frozen filled-document snapshot", () => {
  const document = fromSegments([]);
  document.content.content = [
    {
      type: "paragraph",
      content: [
        {
          type: "documentField",
          attrs: {
            key: "contract.fixed_term",
            label: "Fixed term",
            fieldType: "checkbox",
            required: false,
            checkboxGlyph: "□",
          },
          marks: [
            {
              type: "textStyle",
              attrs: { fontFamily: "Arial", fontSize: 14, color: "#215e99" },
            },
          ],
        },
      ],
    },
  ];
  const saved = parseStyledDocument(
    filledDocument(document, { "contract.fixed_term": "true" }),
  );
  const html = renderNode(saved.content, {});
  expect(html).toContain("□");
  expect(html).toContain("×");
  expect(html).toContain("position:absolute");
  expect(html).toContain("#215e99");
  expect(html).not.toContain("visibility:hidden");
});

it("removes empty stored text runs without removing blank paragraphs, whitespace or footer fields", () => {
  const document = fromSegments([]);
  document.footer = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { marginBottom: 12 },
        content: [{ type: "text", text: "" }],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "" },
          { type: "text", text: " " },
          { type: "pageField", attrs: { kind: "page" } },
        ],
      },
    ],
  };
  const saved = parseStyledDocument(document);
  expect(saved.footer.content).toHaveLength(2);
  expect(saved.footer.content![0].content).toEqual([]);
  expect(saved.footer.content![0].attrs!.marginBottom).toBe(12);
  expect(saved.footer.content![1].content).toEqual([
    { type: "text", text: " " },
    { type: "pageField", attrs: { kind: "page" } },
  ]);
});

it("keeps a checkbox glyph's width so the line on its right stays put", () => {
  const html = renderNode(
    {
      type: "paragraph",
      content: [{ type: "text", text: "☐ bis zum" }],
    },
    {},
  );
  expect(html).toContain("visibility:hidden");
  expect(html).toContain("☐");
  expect(html).toContain("bis zum");
  expect(html).not.toContain('width="0.8em"');
  expect(DOCUMENT_CSS).toContain("line-height:1.5");
});

it("draws a blank underline as one rule instead of a second text decoration", () => {
  const html = renderNode(
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "\u00a0",
          marks: [
            { type: "underline" },
            { type: "textStyle", attrs: { blankUnderlineWidth: 80 } },
          ],
        },
      ],
    },
    {},
  );
  expect(html).not.toContain("<u");
  expect(html).toContain("width:80pt");
  expect(html).toContain("border-bottom:0.5pt solid currentColor");
  expect(html).toContain("white-space:nowrap");
});

it("uses the same bounded line box for small signature captions in editor and PDF", () => {
  const caption = {
    type: "lineGroup",
    attrs: {
      height: 9.45,
      lines: [],
      labels: [
        {
          text: "(Arbeitnehmer)",
          left: 100,
          top: 0,
          fontSize: 7,
          color: "#000000",
        },
      ],
    },
  };
  const normalized = normalizeLineLabels(caption);
  expect(renderNode(caption, {})).toContain("line-height:1.2");
  expect(renderNode(normalized, {})).toContain("line-height:1.2");
  expect(renderNode(normalized, {})).toContain("height:9.45pt");
});

it("reserves room for labels that extend below a stored row after editing", () => {
  const row = {
    type: "lineGroup",
    attrs: { height: 5, lines: [] },
    content: [
      {
        type: "lineLabel",
        attrs: { left: 0, top: 4, fontSize: 10 },
        content: [
          {
            type: "text",
            text: "Caption",
            marks: [{ type: "textStyle", attrs: { fontSize: 20 } }],
          },
        ],
      },
    ],
  };
  expect(renderNode(row, {})).toContain("height:28pt");
});
