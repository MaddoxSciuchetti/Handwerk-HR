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
import { pdfTextColorMatcher } from "./pdfTextPaint";
import { createLigatureRepair } from "./pdfLigatures";
import { pdfHorizontalRules, pdfTextRuns } from "./pdfPageGeometry";
import { restoreDocxStyles, docxHeaderBuffer } from "./docxStyles";

export type Fragment = {
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
  font: string;
  color?: string;
  startsWithLigature?: boolean;
  endsWithLigature?: boolean;
};

export type ImportedRule = {
  x: number;
  y: number;
  width: number;
  thickness: number;
  color: string;
};

export function reconstructLines(
  fragments: Fragment[],
  pageWidth: number,
  recoverTables = true,
  rules: ImportedRule[] = [],
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
  // A long body line often has a midpoint at the page center simply because
  // it spans both margins. Only short, clearly indented lines qualify.
  const leftCounts = new Map<number, number>();
  for (const line of lines) {
    const x =
      Math.round(Math.min(...line.map((fragment) => fragment.x)) / 3) * 3;
    leftCounts.set(x, (leftCounts.get(x) ?? 0) + 1);
  }
  const bodyLeft =
    [...leftCounts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ?? 0;
  const bodySize =
    [...fragments].sort((a, b) => b.text.length - a.text.length)[0]?.size ?? 11;
  const geometricallyCentered = (line: Fragment[]) => {
    const sorted = [...line].sort((a, b) => a.x - b.x);
    const first = sorted[0],
      end = sorted.at(-1)!;
    return (
      first.x > bodyLeft + Math.max(18, first.size * 2) &&
      Math.abs((first.x + end.x + end.width) / 2 - pageWidth / 2) < 8 &&
      end.x + end.width - first.x < pageWidth * 0.55
    );
  };
  const nodes: DocumentNode[] = [];
  const contentLeft = fragments.length
    ? Math.min(...fragments.map((fragment) => fragment.x))
    : 0;
  const unusedRules = [...rules].sort((a, b) => b.y - a.y || a.x - b.x);
  const fontFamilyFor = (font: string) =>
    /times/i.test(font)
      ? "Times New Roman"
      : /helvetica/i.test(font)
        ? "Helvetica"
        : /arial/i.test(font)
          ? "Arial"
          : "Calibri";
  const joinedText = (row: Fragment[]) =>
    row
      .map((fragment) => fragment.text)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
  const signatureCaption =
    /^(?:den|\(Ort\)|\(Datum\)|\(Arbeitgeber\)|\(Arbeitnehmer\))(?:\s*(?:den|\(Ort\)|\(Datum\)|\(Arbeitgeber\)|\(Arbeitnehmer\)))*$/;
  const consume = (chosen: ImportedRule[]) => {
    for (const rule of chosen) {
      const at = unusedRules.indexOf(rule);
      if (at >= 0) unusedRules.splice(at, 1);
    }
  };
  const labelsFor = (row: Fragment[], top: number) =>
    row
      .filter((fragment) => fragment.text.trim())
      .map((fragment) => ({
        left: fragment.x - contentLeft,
        top,
        text: fragment.text,
        fontSize: fragment.size,
        color: fragment.color ?? "#000000",
        fontFamily: fontFamilyFor(fragment.font),
        ...(/bold/i.test(fragment.font) ? { bold: true } : {}),
        ...(/italic|oblique/i.test(fragment.font) ? { italic: true } : {}),
      }));
  const overlapping = (row: Fragment[], tolerance: number) => {
    const sorted = [...row].sort((a, b) => a.x - b.x);
    const start = sorted[0];
    const end = sorted.at(-1)!;
    return unusedRules.filter(
      (rule) =>
        Math.abs(rule.y - start.y) <= tolerance &&
        rule.x < end.x + end.width + 8 &&
        rule.x + rule.width > start.x - 8,
    );
  };
  // Rules that sit between two baselines, not on the text itself.
  const takeSeparators = (above: number, below: number) => {
    const due = unusedRules.filter(
      (rule) => rule.y <= above - 2.5 && rule.y > below + 2.5,
    );
    if (!due.length) return undefined;
    consume(due);
    const groups: ImportedRule[][] = [];
    for (const rule of due.sort((a, b) => b.y - a.y || a.x - b.x)) {
      const group = groups.find((items) => Math.abs(items[0].y - rule.y) < 3);
      if (group) group.push(rule);
      else groups.push([rule]);
    }
    let cursor = above;
    for (const group of groups) {
      const gap = cursor === 10000 ? 0 : cursor - group[0].y;
      nodes.push({
        type: "lineGroup",
        attrs: {
          lines: group.map((rule) => ({
            left: rule.x - contentLeft,
            top: 1,
            width: rule.width,
            thickness: rule.thickness,
            color: rule.color,
          })),
          labels: [],
          height: 4,
          marginTop: Math.max(0, Math.min(48, gap - 14)),
          marginBottom: 0,
          pageRelative: false,
        },
      });
      cursor = group[0].y;
    }
    return cursor;
  };
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
    const onBaseline = overlapping(line, 2.5);
    if (onBaseline.length) {
      consume(onBaseline);
      const labels = labelsFor(line, 0);
      const strokes = onBaseline.map((rule) => ({
        left: rule.x - contentLeft,
        top: first.y - rule.y + first.size * 0.8,
        width: rule.width,
        thickness: rule.thickness,
        color: rule.color,
      }));
      let height = first.size + 4;
      let consumed = index;
      while (consumed + 1 < lines.length) {
        const follower = [...lines[consumed + 1]].sort((a, b) => a.x - b.x);
        const distance = first.y - follower[0].y;
        if (distance <= 0 || distance > 8) break;
        const extra = overlapping(follower, 2.5);
        if (!extra.length || joinedText(follower)) break;
        consume(extra);
        strokes.push(
          ...extra.map((rule) => ({
            left: rule.x - contentLeft,
            top: first.y - rule.y + first.size * 0.8,
            width: rule.width,
            thickness: rule.thickness,
            color: rule.color,
          })),
        );
        consumed++;
      }
      while (consumed + 1 < lines.length) {
        const follower = [...lines[consumed + 1]].sort((a, b) => a.x - b.x);
        const text = joinedText(follower);
        const distance = first.y - follower[0].y;
        if (
          distance <= 0 ||
          distance > 18 ||
          !signatureCaption.test(text) ||
          /Arbeitgeber|Arbeitnehmer/.test(text)
        )
          break;
        labels.push(...labelsFor(follower, distance));
        height = Math.max(height, distance + follower[0].size + 3);
        consumed++;
      }
      nodes.push({
        type: "lineGroup",
        attrs: {
          lines: strokes,
          labels,
          height,
          marginTop: 0,
          marginBottom: 0,
          pageRelative: false,
        },
      });
      previousY = lines[consumed][0].y;
      index = consumed;
      continue;
    }
    const separatorY = takeSeparators(previousY ?? 10000, first.y);
    const marker = first.text.match(/^\s*([•●▪◦‣⁃\uf0b7]|\d+[.)])(?:\s+|$)/);
    const cells = cellsFor(line);
    if (!marker && recoverTables && cells.length > 1) {
      const rows = [cells];
      let next = index + 1;
      while (next < lines.length) {
        const candidate = cellsFor(lines[next]);
        if (
          candidate.length !== cells.length ||
          candidate.some(
            (cell, column) => Math.abs(cell[0].x - cells[column][0].x) > 6,
          ) ||
          Math.abs(lines[next - 1][0].y - lines[next][0].y) > first.size * 2.5
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
    for (const original of line) {
      const f =
        original === first && marker
          ? {
              ...original,
              text: original.text.slice(marker[0].length),
            }
          : original;
      if (!f.text) continue;
      const gapToPrevious = previous ? f.x - (previous.x + previous.width) : 0;
      // Justified Pages lines track letters apart, so a ligature can sit
      // a few points from the rest of its word without a space glyph.
      const insideWord =
        previous &&
        (f.startsWithLigature || previous.endsWithLigature) &&
        /\p{L}$/u.test(previous.text) &&
        /^\p{L}/u.test(f.text) &&
        gapToPrevious < f.size * 0.45;
      if (
        previous &&
        !insideWord &&
        gapToPrevious > f.size * 0.15 &&
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
            ...(f.color ? { color: f.color } : {}),
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
    if (marker) {
      const ordered = /^\d/.test(marker[1]);
      const type = ordered ? "orderedList" : "bulletList";
      const number = ordered ? parseInt(marker[1], 10) : undefined;
      const paragraph: DocumentNode = {
        type: "paragraph",
        attrs: {
          fontSize: line.at(-1)!.size,
          textAlign: "left",
          marginTop: 0,
          marginBottom: 0,
          x: line[1]?.x ?? first.x,
        },
        content: children,
      };
      const item: DocumentNode = {
        type: "listItem",
        content: [paragraph],
      };
      if (
        last?.type === type &&
        Math.abs(Number(last.attrs?.x) - first.x) < 3 &&
        gap <= Math.max(first.size, line.at(-1)!.size) * 2.5 &&
        (!ordered ||
          number ===
            Number(last.attrs?.start ?? 1) + (last.content?.length ?? 0))
      ) {
        last.content!.push(item);
      } else
        nodes.push({
          type,
          attrs: {
            x: first.x,
            fontSize: first.size,
            ...(first.color ? { color: first.color } : {}),
            paddingLeft: Math.min(
              200,
              Math.max(
                12,
                (line[1]?.x ?? first.x + 20) -
                  Math.min(...fragments.map((fragment) => fragment.x)),
              ),
            ),
            ...(ordered ? { start: number } : {}),
          },
          content: [item],
        });
      previousY = first.y;
      continue;
    }
    const listParagraph = ["bulletList", "orderedList"].includes(
      last?.type ?? "",
    )
      ? last?.content?.at(-1)?.content?.at(-1)
      : undefined;
    if (
      listParagraph &&
      Math.abs(Number(listParagraph.attrs?.x) - first.x) < 3 &&
      gap > 0 &&
      gap <= first.size * 1.85
    ) {
      listParagraph.content!.push({ type: "text", text: " " }, ...children);
      previousY = first.y;
      continue;
    }
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
      const centered =
        recoverTables &&
        geometricallyCentered(line) &&
        (/bold/i.test(first.font) ||
          first.size > bodySize * 1.15 ||
          [lines[index - 1], lines[index + 1]].some(
            (neighbor) =>
              neighbor &&
              Math.abs(neighbor[0].y - first.y) < first.size * 2.5 &&
              geometricallyCentered(neighbor),
          ));
      const signature = nodes.at(-1);
      const caption = joinedText(line);
      const locksToLine =
        separatorY !== undefined &&
        signature?.type === "lineGroup" &&
        (signatureCaption.test(caption) ||
          /^Ort, Datum Unterschrift\b/.test(caption));
      if (locksToLine && signature?.attrs) {
        const top = Math.max(0, 1 + (separatorY - first.y) - first.size * 0.8);
        signature.attrs = {
          ...signature.attrs,
          labels: labelsFor(line, top),
          height: Math.max(
            Number(signature.attrs.height) || 0,
            top + first.size + 4,
          ),
        };
      } else
        nodes.push({
          type: "paragraph",
          attrs: {
            x: first.x,
            fontSize: first.size,
            marginTop:
              separatorY !== undefined
                ? Math.max(0, Math.min(40, separatorY - first.y - first.size))
                : gap > first.size * 1.6
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
  takeSeparators(previousY ?? 10000, -1000);
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
    if (
      type === "paragraph" &&
      children.some((node) => node.type === "image")
    ) {
      const blocks: DocumentNode[] = [];
      let inline: DocumentNode[] = [];
      const flush = () => {
        if (inline.length) blocks.push({ type: "paragraph", content: inline });
        inline = [];
      };
      for (const node of children) {
        if (node.type === "image") {
          flush();
          blocks.push(node);
        } else inline.push(node);
      }
      flush();
      return blocks;
    }
    if (
      type === "listItem" &&
      children.some((node) => node.type === "text" || node.type === "hardBreak")
    ) {
      // Tiptap requires a paragraph as the first child of every list item;
      // Mammoth emits inline children for simple Word list paragraphs.
      const blocks: DocumentNode[] = [];
      let inline: DocumentNode[] = [];
      const flush = () => {
        if (inline.length) blocks.push({ type: "paragraph", content: inline });
        inline = [];
      };
      for (const node of children) {
        if (node.type === "text" || node.type === "hardBreak")
          inline.push(node);
        else {
          flush();
          blocks.push(node);
        }
      }
      flush();
      return [{ type, content: blocks }];
    }
    return type
      ? [
          {
            type,
            ...(type === "orderedList"
              ? {
                  attrs: {
                    start: Number(el.getAttribute("start")) || 1,
                  },
                }
              : {}),
            content: children,
          },
        ]
      : children;
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
    const convert = (buffer: Buffer) =>
      mammoth.convertToHtml(
        { buffer },
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
    const converted = await convert(file.buffer);
    const document = {
      ...fromSegments([]),
      content: htmlNodes(converted.value),
    };
    await restoreDocxStyles(file.buffer, document);
    const headerBuffer = await docxHeaderBuffer(file.buffer);
    if (headerBuffer) {
      const header = {
        ...fromSegments([]),
        content: htmlNodes((await convert(headerBuffer)).value),
      };
      await restoreDocxStyles(headerBuffer, header);
      const textOf = (node: DocumentNode): string =>
        node.text ?? (node.content ?? []).map(textOf).join("");
      const hasPageField = (node: DocumentNode): boolean =>
        node.type === "pageField" || (node.content ?? []).some(hasPageField);
      const footerLines: DocumentNode[] = [];
      header.content.content = (header.content.content ?? []).filter((node) => {
        const text = textOf(node);
        // Pages anchors the footer text inside the header, at the
        // bottom of the page. It belongs in the footer. The page
        // count is a Word field, so the stored "1" is not the total.
        if (
          /Nicht zutreffendes bitte streichen/.test(text) ||
          hasPageField(node) ||
          /Seite\s+\d+\s+von\s+\d+/.test(text)
        ) {
          if (hasPageField(node) || /Seite\s+\d+\s+von\s+\d+/.test(text))
            node.attrs = {
              ...node.attrs,
              textAlign: "right",
              marginLeft: 0,
            };
          footerLines.push(node);
          return false;
        }
        return true;
      });
      document.header = header.content;
      if (footerLines.length)
        document.footer = {
          type: "doc",
          content: [...(document.footer?.content ?? []), ...footerLines],
        };
    }
    const footerBuffer = await docxHeaderBuffer(file.buffer, "footer");
    if (footerBuffer) {
      const footer = {
        ...fromSegments([]),
        content: htmlNodes((await convert(footerBuffer)).value),
      };
      await restoreDocxStyles(footerBuffer, footer);
      document.footer.content = [
        ...(document.footer.content ?? []),
        ...(footer.content.content ?? []),
      ];
    }
    return {
      document,
      warnings: [
        "Word-Schriftarten und Seitenlayout anhand der Vorlage prüfen.",
        "Nummerierungs-Neustarts mit dem Original vergleichen: Pages-Word-Exporte können von der dargestellten Pages/PDF-Nummerierung abweichen.",
        ...(headerBuffer
          ? [
              "Kopfzeile übernommen; abschnittsabhängige Varianten und Grafikpositionen anhand des Originals prüfen.",
            ]
          : []),
        ...converted.messages.map((m) => m.message),
      ],
    };
  }
  if (!name.endsWith(".pdf"))
    throw new AppError(
      BAD_REQUEST,
      "Erlaubt sind PDF, DOCX und TXT. Pages für beste Text-/Stiltreue bitte als Word (DOCX) exportieren.",
    );
  const task = getDocument({
    data: new Uint8Array(file.buffer),
    fontExtraProperties: true,
    useSystemFonts: false,
  });
  const pdf = await task.promise;
  try {
    if (pdf.numPages > 50)
      throw new AppError(BAD_REQUEST, "Bitte höchstens 50 Seiten importieren.");
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
      const paints = pdfTextColorMatcher(ops);
      const fontRepairs = new Map<
        string,
        (unicode: string, fontChar?: string) => string
      >();
      const fontLabel = (fontId: string) => {
        let font = text.styles[fontId]?.fontFamily ?? "";
        try {
          const loaded = page.commonObjs.get(fontId) as {
            name?: string;
            data?: Uint8Array;
          };
          font = loaded?.name ?? font;
          if (!fontRepairs.has(fontId))
            fontRepairs.set(fontId, createLigatureRepair(loaded?.data));
        } catch {
          warnings.add("Einige Schriftzuordnungen prüfen.");
          if (!fontRepairs.has(fontId))
            fontRepairs.set(fontId, (unicode) => unicode.normalize("NFKC"));
        }
        if (
          font &&
          !/calibri|times|helvetica|arial|symbol|wingdings/i.test(font)
        )
          warnings.add(
            "Eine unbekannte Schrift wurde Calibri zugeordnet. Bitte vor Freigabe manuell korrigieren.",
          );
        return font;
      };
      const runs = pdfTextRuns(ops, {
        fontName: fontLabel,
        repair: (unicode, fontChar, fontId) => {
          fontLabel(fontId);
          return (fontRepairs.get(fontId) ?? ((value: string) => value))(
            unicode,
            fontChar,
          );
        },
        color: (original) => paints.match(original)[0]?.color ?? "#000000",
      });
      const fragments: Fragment[] = runs.length
        ? runs
        : text.items.flatMap((item) => {
            if (!("str" in item) || !item.str.trim()) return [];
            const font = fontLabel(item.fontName);
            let advance = 0;
            return paints.match(item.str).map((run) => {
              const width = (item.width * run.text.length) / item.str.length;
              const fragment = {
                text: run.text,
                color: run.color,
                x: item.transform[4] + advance,
                y: item.transform[5],
                width,
                size:
                  Math.hypot(item.transform[2], item.transform[3]) ||
                  item.height ||
                  11,
                font,
              };
              advance += width;
              return fragment;
            });
          });
      if (paints.reviewRequired())
        warnings.add(
          "Einige PDF-Textfarben konnten nicht eindeutig zugeordnet werden. Bitte mit dem Original vergleichen.",
        );
      if (n > 1) content.push({ type: "pageBreak" });
      if (!fragments.length)
        warnings.add(
          "Seite " +
            n +
            " enthält keinen lesbaren Text; OCR ist nicht verfügbar.",
        );
      lefts.push((Math.min(...fragments.map((f) => f.x), 72) * 25.4) / 72);
      // Recover bitmap letterhead/logos; their precise placement is reviewed by the user.
      let matrix = [1, 0, 0, 1, 0, 0];
      const matrices: number[][] = [];
      for (let i = 0; i < ops.fnArray.length; i++) {
        if (ops.fnArray[i] === OPS.save) matrices.push([...matrix]);
        else if (ops.fnArray[i] === OPS.restore)
          matrix = matrices.pop() ?? [1, 0, 0, 1, 0, 0];
        else if (ops.fnArray[i] === OPS.transform) {
          const [a, b, c, d, e, f] = ops.argsArray[i] as number[];
          const [m0, m1, m2, m3, m4, m5] = matrix;
          matrix = [
            m0 * a + m2 * b,
            m1 * a + m3 * b,
            m0 * c + m2 * d,
            m1 * c + m3 * d,
            m0 * e + m2 * f + m4,
            m1 * e + m3 * f + m5,
          ];
        }
        if (ops.fnArray[i] !== OPS.paintImageXObject) continue;
        try {
          const id = String(ops.argsArray[i][0]);
          const image = (id.startsWith("g_") ? page.commonObjs : page.objs).get(
            id,
          ) as {
            width: number;
            height: number;
            data: Uint8Array;
          };
          if (!image.data || image.width * image.height > 2_000_000) continue;
          const channels = image.data.length / (image.width * image.height);
          if (channels !== 3 && channels !== 4) continue;
          const png = new PNG({
            width: image.width,
            height: image.height,
          });
          for (let pixel = 0; pixel < image.width * image.height; pixel++) {
            png.data[pixel * 4] = image.data[pixel * channels];
            png.data[pixel * 4 + 1] = image.data[pixel * channels + 1];
            png.data[pixel * 4 + 2] = image.data[pixel * channels + 2];
            png.data[pixel * 4 + 3] =
              channels === 4 ? image.data[pixel * channels + 3] : 255;
          }
          content.push({
            type: "image",
            attrs: {
              src:
                "data:image/png;base64," +
                PNG.sync.write(png).toString("base64"),
              // PDF image transforms describe physical size, not
              // bitmap pixels. HTML image width is in CSS pixels.
              width: Math.min(
                2000,
                Math.max(1, (Math.hypot(matrix[0], matrix[1]) * 96) / 72),
              ),
              alt: "Importierte Grafik",
            },
          });
        } catch {
          warnings.add("Eine Grafik konnte nicht übernommen werden.");
        }
      }
      content.push(
        ...reconstructLines(
          fragments,
          viewport.width,
          true,
          pdfHorizontalRules(ops, viewport.width, viewport.height),
        ),
      );
    }
    if (
      !content.some((node) =>
        ["paragraph", "table", "bulletList", "orderedList"].includes(node.type),
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
