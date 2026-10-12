// Local-only reference benchmark. No document text, values or binaries are logged
// or checked into Git. Pass fresh exports from the actual Pages source.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { importStyledDocument } from "../src/services/importStyledDocument";
import { parseStyledDocument } from "../src/services/styledDocument";
import type { DocumentNode } from "../../shared/document";

if (process.argv.length < 3) throw new Error("Pass reference PDF/DOCX paths.");
for (const path of process.argv.slice(2)) {
    const buffer = await fs.readFile(path);
    const { document, warnings } = await importStyledDocument({
        originalname: path.split("/").at(-1)!,
        buffer,
    } as Express.Multer.File);
    parseStyledDocument(document);
    const colors = new Set<string>();
    const fonts = new Set<string>();
    const counts = {
        paragraphs: 0,
        listItems: 0,
        mergedBulletParagraphs: 0,
        centered: 0,
        justified: 0,
        images: 0,
        pageBreaks: 0,
    };
    const bulletGroups: number[] = [];
    const plain = (node: DocumentNode): string =>
        node.text ?? (node.content ?? []).map(plain).join("");
    const walk = (node: DocumentNode) => {
        if (node.type === "paragraph") {
            counts.paragraphs++;
            if ((plain(node).match(/[•\uf0b7]/g) ?? []).length > 1)
                counts.mergedBulletParagraphs++;
        }
        if (node.attrs?.textAlign === "center") counts.centered++;
        if (node.attrs?.textAlign === "justify") counts.justified++;
        if (node.type === "listItem") counts.listItems++;
        if (node.type === "image") counts.images++;
        if (node.type === "pageBreak") counts.pageBreaks++;
        if (node.type === "bulletList")
            bulletGroups.push(node.content?.length ?? 0);
        for (const mark of node.marks ?? []) {
            if (typeof mark.attrs?.color === "string")
                colors.add(mark.attrs.color);
            if (typeof mark.attrs?.fontFamily === "string")
                fonts.add(mark.attrs.fontFamily);
        }
        node.content?.forEach(walk);
    };
    [document.content, document.header, document.footer].forEach(walk);
    console.log(
        JSON.stringify({
            format: path.split(".").at(-1),
            sourceSha256: createHash("sha256").update(buffer).digest("hex"),
            ...counts,
            bulletGroups,
            colors: [...colors].sort(),
            fonts: [...fonts].sort(),
            warningCount: warnings.length,
        }),
    );
}
