import mammoth from "mammoth";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseHTML } from "linkedom";
import { PNG } from "pngjs";
import {
    fromSegments,
    DEFAULT_PAGE,
    type DocumentNode,
    type StyledDocument,
} from "../../../shared/document";
import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";

type Fragment = {
    text: string;
    x: number;
    y: number;
    width: number;
    size: number;
    font: string;
};

export function reconstructLines(
    fragments: Fragment[],
    pageWidth: number,
    recoverTables = true,
): DocumentNode[] {
    const lines: Fragment[][] = [];
    for (const f of [...fragments].sort((a, b) => b.y - a.y || a.x - b.x)) {
        const line = lines.find(
            (l) => Math.abs(l[0].y - f.y) < Math.max(2, f.size * 0.25),
        );
        if (line) line.push(f);
        else lines.push([f]);
    }
    let previousY: number | undefined;
    const nodes: DocumentNode[] = [];
    const cellsFor = (line: Fragment[]) => {
        const cells: Fragment[][] = [];
        for (const fragment of [...line].sort((a, b) => a.x - b.x)) {
            const previous = cells.at(-1)?.at(-1);
            if (
                !previous ||
                fragment.x - previous.x - previous.width >
                    Math.max(36, fragment.size * 3)
            )
                cells.push([fragment]);
            else cells.at(-1)!.push(fragment);
        }
        return cells;
    };
    for (let index = 0; index < lines.length; index++) {
        const raw = lines[index];
        const line = raw.sort((a, b) => a.x - b.x);
        const first = line[0];
        const cells = cellsFor(line);
        if (recoverTables && cells.length > 1) {
            const rows = [cells];
            let next = index + 1;
            while (next < lines.length) {
                const candidate = cellsFor(lines[next]);
                if (
                    candidate.length !== cells.length ||
                    candidate.some(
                        (cell, column) =>
                            Math.abs(cell[0].x - cells[column][0].x) > 6,
                    ) ||
                    Math.abs(lines[next - 1][0].y - lines[next][0].y) >
                        first.size * 2.5
                )
                    break;
                rows.push(candidate);
                next++;
            }
            // Isolated wide gaps remain prose; only aligned consecutive rows become tables.
            if (rows.length >= 2) {
                nodes.push({
                    type: "table",
                    content: rows.map((row) => ({
                        type: "tableRow",
                        content: row.map((cell) => ({
                            type: "tableCell",
                            attrs: { colspan: 1, rowspan: 1 },
                            content: reconstructLines(cell, pageWidth, false),
                        })),
                    })),
                });
                previousY = lines[next - 1][0].y;
                index = next - 1;
                continue;
            }
        }
        const gap = previousY === undefined ? 0 : previousY - first.y;
        const children: DocumentNode[] = [];
        let previous: Fragment | undefined;
        for (const f of line) {
            if (
                previous &&
                f.x - (previous.x + previous.width) > f.size * 0.15 &&
                !previous.text.endsWith(" ") &&
                !f.text.startsWith(" ")
            )
                children.push({ type: "text", text: " " });
            const family = /calibri/i.test(f.font)
                ? "Calibri"
                : /times/i.test(f.font)
                  ? "Times New Roman"
                  : /helvetica/i.test(f.font)
                    ? "Helvetica"
                    : /arial/i.test(f.font)
                      ? "Arial"
                      : /wingdings/i.test(f.font)
                        ? "Wingdings"
                        : /apple.?symbols/i.test(f.font)
                          ? "Apple Symbols"
                          : /symbol/i.test(f.font)
                            ? "Symbol"
                            : "Calibri";
            const marks: NonNullable<DocumentNode["marks"]> = [
                {
                    type: "textStyle",
                    attrs: {
                        fontFamily: family,
                        fontSize: Math.min(72, Math.max(4, f.size)),
                    },
                },
            ];
            if (/bold/i.test(f.font)) marks.push({ type: "bold" });
            if (/italic|oblique/i.test(f.font)) marks.push({ type: "italic" });
            if (f.text) children.push({ type: "text", text: f.text, marks });
            previous = f;
        }
        // Only group lines into paragraphs when their baselines, indentation and font agree.
        const last = nodes.at(-1);
        const sameStyle =
            last?.attrs?.fontSize === first.size &&
            Math.abs(Number(last.attrs?.x ?? 0) - first.x) < 3;
        if (
            last?.type === "paragraph" &&
            sameStyle &&
            gap > 0 &&
            gap <= first.size * 1.45
        ) {
            last.content!.push({ type: "text", text: " " }, ...children);
        } else {
            const end = line.at(-1)!;
            const centered =
                Math.abs((first.x + end.x + end.width) / 2 - pageWidth / 2) <
                    10 && end.x + end.width - first.x < pageWidth * 0.85;
            nodes.push({
                type: "paragraph",
                attrs: {
                    x: first.x,
                    fontSize: first.size,
                    marginTop:
                        gap > first.size * 1.6
                            ? Math.min(40, gap - first.size)
                            : 0,
                    marginBottom: 0,
                    textAlign: centered ? "center" : "left",
                },
                content: children,
            });
        }
        previousY = first.y;
    }
    return nodes;
}

function htmlNodes(html: string): DocumentNode {
    const { document } = parseHTML("<html><body>" + html + "</body></html>");
    const walk = (
        node: globalThis.Node,
        marks: NonNullable<DocumentNode["marks"]> = [],
    ): DocumentNode[] => {
        if (node.nodeType === 3)
            return node.textContent
                ? [{ type: "text", text: node.textContent, marks }]
                : [];
        const el = node as unknown as HTMLElement;
        const tag = el.tagName?.toLowerCase();
        const mark = (
            {
                strong: "bold",
                b: "bold",
                em: "italic",
                i: "italic",
                u: "underline",
                s: "strike",
            } as Record<string, string>
        )[tag];
        const children = [...node.childNodes].flatMap((c) =>
            walk(c, mark ? [...marks, { type: mark }] : marks),
        );
        if (mark) return children;
        if (tag === "br") return [{ type: "hardBreak" }];
        if (tag === "img")
            return [
                {
                    type: "image",
                    attrs: {
                        src: el.getAttribute("src") ?? "",
                        alt: el.getAttribute("alt") ?? "",
                    },
                },
            ];
        const type = (
            {
                p: "paragraph",
                ul: "bulletList",
                ol: "orderedList",
                li: "listItem",
                table: "table",
                tr: "tableRow",
                td: "tableCell",
                th: "tableHeader",
                blockquote: "blockquote",
            } as Record<string, string>
        )[tag];
        if (/^h[1-6]$/.test(tag))
            return [
                {
                    type: "heading",
                    attrs: { level: Number(tag[1]) },
                    content: children,
                },
            ];
        return type ? [{ type, content: children }] : children;
    };
    return {
        type: "doc",
        content: [...document.body.childNodes].flatMap((n) =>
            walk(n as unknown as globalThis.Node),
        ),
    };
}

export async function importStyledDocument(
    file: Express.Multer.File,
): Promise<{ document: StyledDocument; warnings: string[] }> {
    const name = file.originalname.toLowerCase();
    if (name.endsWith(".txt"))
        return {
            document: fromSegments([
                { type: "text", text: file.buffer.toString("utf8") },
            ]),
            warnings: ["TXT enthält keine Formatierung."],
        };
    if (name.endsWith(".docx")) {
        const converted = await mammoth.convertToHtml(
            { buffer: file.buffer },
            {
                convertImage: mammoth.images.imgElement(async (image) => ({
                    src:
                        "data:" +
                        image.contentType +
                        ";base64," +
                        (await image.read("base64")),
                })),
            },
        );
        return {
            document: {
                ...fromSegments([]),
                content: htmlNodes(converted.value),
            },
            warnings: [
                "Word-Schriftarten und Seitenlayout anhand der Vorlage prüfen.",
                ...converted.messages.map((m) => m.message),
            ],
        };
    }
    if (!name.endsWith(".pdf"))
        throw new AppError(
            BAD_REQUEST,
            "Erlaubt sind PDF, DOCX und TXT. Pages bitte als PDF exportieren.",
        );
    const task = getDocument({
        data: new Uint8Array(file.buffer),
        fontExtraProperties: true,
        useSystemFonts: false,
    });
    const pdf = await task.promise;
    try {
        if (pdf.numPages > 50)
            throw new AppError(
                BAD_REQUEST,
                "Bitte höchstens 50 Seiten importieren.",
            );
        const content: DocumentNode[] = [];
        const widths: number[] = [];
        const lefts: number[] = [];
        let height = DEFAULT_PAGE.height;
        const warnings = new Set([
            "PDF-Import prüfen: Tabellen, Einzüge, Vektorgrafiken und Kopf-/Fußzeilen benötigen gegebenenfalls manuelle Korrektur.",
        ]);
        for (let n = 1; n <= pdf.numPages; n++) {
            const page = await pdf.getPage(n);
            const viewport = page.getViewport({ scale: 1 });
            widths.push((viewport.width * 25.4) / 72);
            height = (viewport.height * 25.4) / 72;
            const ops = await page.getOperatorList();
            const text = await page.getTextContent();
            const fragments: Fragment[] = [];
            for (const item of text.items) {
                if (!("str" in item) || !item.str.trim()) continue;
                let font = text.styles[item.fontName]?.fontFamily ?? "";
                try {
                    const f = page.commonObjs.get(item.fontName) as {
                        name?: string;
                    };
                    font = f.name ?? font;
                } catch {
                    warnings.add("Einige Schriftzuordnungen prüfen.");
                }
                if (
                    !/calibri|times|helvetica|arial|symbol|wingdings/i.test(
                        font,
                    )
                )
                    warnings.add(
                        "Eine unbekannte Schrift wurde Calibri zugeordnet. Bitte vor Freigabe manuell korrigieren.",
                    );
                fragments.push({
                    text: item.str,
                    x: item.transform[4],
                    y: item.transform[5],
                    width: item.width,
                    size:
                        Math.hypot(item.transform[2], item.transform[3]) ||
                        item.height ||
                        11,
                    font,
                });
            }
            if (n > 1) content.push({ type: "pageBreak" });
            if (!fragments.length)
                warnings.add(
                    "Seite " +
                        n +
                        " enthält keinen lesbaren Text; OCR ist nicht verfügbar.",
                );
            lefts.push(
                (Math.min(...fragments.map((f) => f.x), 72) * 25.4) / 72,
            );
            // Recover bitmap letterhead/logos; their precise placement is reviewed by the user.
            for (let i = 0; i < ops.fnArray.length; i++) {
                if (ops.fnArray[i] !== OPS.paintImageXObject) continue;
                try {
                    const image = page.objs.get(ops.argsArray[i][0]) as {
                        width: number;
                        height: number;
                        data: Uint8Array;
                    };
                    if (!image.data || image.width * image.height > 2_000_000)
                        continue;
                    const channels =
                        image.data.length / (image.width * image.height);
                    if (channels !== 3 && channels !== 4) continue;
                    const png = new PNG({
                        width: image.width,
                        height: image.height,
                    });
                    for (
                        let pixel = 0;
                        pixel < image.width * image.height;
                        pixel++
                    ) {
                        png.data[pixel * 4] = image.data[pixel * channels];
                        png.data[pixel * 4 + 1] =
                            image.data[pixel * channels + 1];
                        png.data[pixel * 4 + 2] =
                            image.data[pixel * channels + 2];
                        png.data[pixel * 4 + 3] =
                            channels === 4
                                ? image.data[pixel * channels + 3]
                                : 255;
                    }
                    content.push({
                        type: "image",
                        attrs: {
                            src:
                                "data:image/png;base64," +
                                PNG.sync.write(png).toString("base64"),
                            width: Math.min(image.width, 500),
                            alt: "Importierte Grafik",
                        },
                    });
                } catch {
                    warnings.add("Eine Grafik konnte nicht übernommen werden.");
                }
            }
            content.push(...reconstructLines(fragments, viewport.width));
        }
        if (
            !content.some(
                (node) => node.type === "paragraph" || node.type === "table",
            )
        )
            throw new AppError(
                BAD_REQUEST,
                "Dieses PDF enthält keinen lesbaren Text. Bitte eine textbasierte Vorlage hochladen.",
            );
        return {
            document: {
                ...fromSegments([]),
                content: { type: "doc", content },
                page: {
                    ...DEFAULT_PAGE,
                    width: widths[0],
                    height,
                    marginLeft: Math.max(5, Math.min(...lefts)),
                    fontSize: 8,
                },
            },
            warnings: [...warnings],
        };
    } finally {
        await task.destroy();
    }
}
