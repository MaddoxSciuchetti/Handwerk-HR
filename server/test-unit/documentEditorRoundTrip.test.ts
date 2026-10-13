import { fromSegments } from "../../shared/document";
import { renderNode } from "../../shared/documentRendering";
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
