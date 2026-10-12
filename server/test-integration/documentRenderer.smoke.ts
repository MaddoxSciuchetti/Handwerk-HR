// Local renderer smoke test; uses explicitly selected Arial fixture fonts, not substitute Calibri.
import { mkdtemp, copyFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fromSegments } from "../../shared/document";

const output = await mkdtemp(join(tmpdir(), "handwerk-pdf-smoke-"));
const fontDirectory = process.env.DOCUMENT_SMOKE_FONT_DIR ?? output;
if (!process.env.DOCUMENT_SMOKE_FONT_DIR) {
    await copyFile(
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        join(output, "Arial.ttf"),
    );
    await copyFile(
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        join(output, "Arial-Bold.ttf"),
    );
}
process.env.DOCUMENT_FONT_DIR = fontDirectory;
process.env.GOTENBERG_URL = "http://localhost:3001";
const { generateDocumentPdf } = await import("../src/services/documentPdf");
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
document.page.fontFamily = "Arial";
document.content.content![0].content![0].marks = [{ type: "bold" }];
document.header = fromSegments([
    { type: "text", text: "BSB – Rendererprüfung" },
]).content;
document.footer = fromSegments([{ type: "text", text: "Vertraulich" }]).content;
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
const result = await generateDocumentPdf(document, {
    "contract.name":
        "Jörg Maximilian Müller-Lüdenscheidt mit einem bewusst langen vollständigen Namen",
    "contract.accept": "true",
});
const path = join(output, "renderer.pdf");
await writeFile(path, result.bytes);
console.log(
    JSON.stringify({ path, contentHash: result.hash, fonts: result.fonts }),
);
