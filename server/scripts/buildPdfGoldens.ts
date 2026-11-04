/**
 * Build golden *inputs* (and optional Chromium baselines).
 *
 * Chromium baselines (`chromium.pdf`) must only be captured while a Chromium
 * HTML printer (historical Gotenberg on :3001) is available. Re-running this
 * script after the native cutover will refuse to overwrite existing
 * `chromium.pdf` files unless FORCE_CHROMIUM_GOLDEN=1 is set together with
 * GOTENBERG_URL.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fromSegments, type StyledDocument } from "../../shared/document";
import { documentFields } from "../../shared/document";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const goldens = join(root, "test-fixtures/pdf-goldens");
process.env.DOCUMENT_FONT_DIR =
  process.env.DOCUMENT_FONT_DIR?.trim() || join(root, "document-fonts");

function smokeDocument(): { document: StyledDocument; values: Record<string, string> } {
  const document = fromSegments([
    {
      type: "text",
      text: "Arbeitsvertrag\nDieser Vertrag wird geschlossen mit ",
    },
    { type: "input", key: "contract.name", label: "Name" },
    {
      type: "text",
      text: ".\nDie nachfolgenden Absätze müssen natürlich umbrechen.\nBestätigt: ",
    },
    {
      type: "input",
      key: "contract.accept",
      label: "Bestätigung",
      fieldType: "checkbox",
      required: false,
    },
  ]);
  document.page.fontFamily = "Calibri";
  document.content.content![0].content![0].marks = [{ type: "bold" }];
  document.header = fromSegments([
    { type: "text", text: "BSB – Rendererprüfung" },
  ]).content;
  document.footer = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        attrs: { textAlign: "right" },
        content: [
          { type: "text", text: "Seite " },
          { type: "pageField", attrs: { kind: "page" } },
          { type: "text", text: " von " },
          { type: "pageField", attrs: { kind: "pages" } },
        ],
      },
    ],
  };
  document.content.content!.push({
    type: "table",
    content: [
      {
        type: "tableRow",
        content: [
          {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Arbeitsbeginn" }],
              },
            ],
          },
          {
            type: "tableCell",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "09.10.2026" }],
              },
            ],
          },
        ],
      },
    ],
  });
  for (let i = 0; i < 45; i++)
    document.content.content!.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text:
            "Absatz " +
            (i + 1) +
            ": Ä, Ö, Ü, ß – mehrseitiger Vertrag ohne überlappende Inhalte.",
        },
      ],
    });
  return {
    document,
    values: {
      "contract.name":
        "Jörg Maximilian Müller-Lüdenscheidt mit einem bewusst langen vollständigen Namen",
      "contract.accept": "true",
    },
  };
}

function featureEdgesDocument(): {
  document: StyledDocument;
  values: Record<string, string>;
} {
  const document: StyledDocument = {
    version: 3,
    page: {
      width: 210,
      height: 297,
      marginTop: 20,
      marginBottom: 25,
      marginLeft: 20,
      marginRight: 20,
      fontFamily: "Arial",
      fontSize: 11,
    },
    header: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Feature-Edges Header" }],
        },
      ],
    },
    footer: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { textAlign: "center" },
          content: [
            { type: "text", text: "S. " },
            { type: "pageField", attrs: { kind: "page" } },
            { type: "text", text: "/" },
            { type: "pageField", attrs: { kind: "pages" } },
          ],
        },
      ],
    },
    content: {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Feature Edges" }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Plain " },
            { type: "text", text: "bold", marks: [{ type: "bold" }] },
            { type: "text", text: " " },
            { type: "text", text: "italic", marks: [{ type: "italic" }] },
            { type: "text", text: " " },
            {
              type: "text",
              text: "under",
              marks: [{ type: "underline" }],
            },
            { type: "text", text: " " },
            {
              type: "text",
              text: "strike",
              marks: [{ type: "strike" }],
            },
            { type: "text", text: " and blank " },
            {
              type: "text",
              text: " ",
              marks: [
                {
                  type: "textStyle",
                  attrs: { blankUnderlineWidth: 40 },
                },
              ],
            },
            { type: "text", text: "." },
          ],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Accept: " },
            {
              type: "documentField",
              attrs: {
                key: "accept",
                label: "Accept",
                fieldType: "checkbox",
                required: false,
              },
            },
            { type: "text", text: " Date: " },
            {
              type: "documentField",
              attrs: {
                key: "start",
                label: "Start",
                fieldType: "date",
              },
            },
          ],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Erstpunkt" }],
                },
              ],
            },
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Zweitpunkt" }],
                },
              ],
            },
          ],
        },
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [
            {
              type: "listItem",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Nummeriert ab 3" }],
                },
              ],
            },
          ],
        },
        {
          type: "blockquote",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Zitat mit Rand." }],
            },
          ],
        },
        {
          type: "table",
          attrs: { border: "box" },
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Box A" }],
                    },
                  ],
                },
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "Box B" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "table",
          attrs: { border: "none" },
          content: [
            {
              type: "tableRow",
              content: [
                {
                  type: "tableCell",
                  content: [
                    {
                      type: "paragraph",
                      content: [{ type: "text", text: "NoBorder" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: "lineGroup",
          attrs: {
            height: 36,
            lines: [
              { left: 20, top: 18, width: 120, thickness: 0.75, color: "#000000" },
              { left: 180, top: 18, width: 120, thickness: 0.75, color: "#000000" },
            ],
            labels: [
              {
                text: "(Arbeitgeber)",
                left: 80,
                top: 22,
                fontSize: 7,
                fontFamily: "Arial",
                color: "#000000",
                centered: true,
              },
              {
                text: "(Arbeitnehmer)",
                left: 240,
                top: 22,
                fontSize: 7,
                fontFamily: "Arial",
                color: "#000000",
                centered: true,
              },
            ],
          },
        },
        { type: "pageBreak" },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Zweite Seite nach pageBreak – Unicode ☐ und ☑ im Fließtext.",
            },
          ],
        },
      ],
    },
  };
  return {
    document,
    values: { accept: "true", start: "2026-03-15" },
  };
}

async function saveGolden(
  id: string,
  document: StyledDocument,
  values: Record<string, string>,
) {
  const dir = join(goldens, id);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "input.json"),
    JSON.stringify({ document, values }, null, 2),
  );
  const chromiumPath = join(dir, "chromium.pdf");
  const { access } = await import("node:fs/promises");
  const exists = await access(chromiumPath).then(
    () => true,
    () => false,
  );
  if (exists && process.env.FORCE_CHROMIUM_GOLDEN !== "1") {
    console.log(
      JSON.stringify({ id, skipped: "chromium.pdf already present" }),
    );
    return;
  }
  console.warn(
    id +
      ": chromium.pdf missing — capture once with a Chromium HTML printer, then commit. Refusing to write native output as chromium.pdf.",
  );
}

async function importBlanco() {
  const path =
    process.env.ARBEITSVERTRAG_DOCX?.trim() ||
    join(root, "../documents_real/Arbeitsvertrag_Blanco.docx");
  const buffer = await readFile(path);
  const { importStyledDocument } = await import(
    "../src/services/importStyledDocument"
  );
  const { document } = await importStyledDocument({
    buffer,
    originalname: "Arbeitsvertrag_Blanco.docx",
    mimetype:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: buffer.length,
    fieldname: "file",
    encoding: "7bit",
    destination: "",
    filename: "",
    path: "",
    stream: undefined as never,
  } as Express.Multer.File);
  const values: Record<string, string> = {};
  for (const field of documentFields(document)) {
    if (field.fieldType === "checkbox") values[field.key] = "false";
    else if (field.fieldType === "date") values[field.key] = "2026-01-15";
    else if (field.fieldType === "points")
      values[field.key] = "Punkt eins\nPunkt zwei";
    else values[field.key] = "Musterwert " + field.label.slice(0, 24);
  }
  return { document, values };
}

const smoke = smokeDocument();
await saveGolden("renderer-smoke", smoke.document, smoke.values);
const edges = featureEdgesDocument();
await saveGolden("feature-edges", edges.document, edges.values);
try {
  const blanco = await importBlanco();
  await saveGolden("arbeitsvertrag-blanco", blanco.document, blanco.values);
} catch (error) {
  console.warn(
    "Skipping arbeitsvertrag-blanco golden:",
    error instanceof Error ? error.message : error,
  );
}
