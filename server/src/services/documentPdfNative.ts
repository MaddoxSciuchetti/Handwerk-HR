import { createElement, type ReactElement, type ReactNode } from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Svg,
  Path,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import {
  descriptionPointLines,
  currentDocumentDate,
  type DocumentNode,
  type StyledDocument,
} from "../../../shared/document";
import {
  FONT_FAMILIES,
  LINE_LABEL_LINE_HEIGHT,
  lineGroupFlowLines,
  lineGroupHeight,
} from "../../../shared/documentRendering";

const MM_TO_PT = 72 / 25.4;
/** Optical scale: Yoga + react-pdf metrics run larger than Chromium for same TTF. */
const FONT_SCALE = 0.93;
/**
 * react-pdf line boxes run taller than Chromium for the same CSS line-height.
 * Map authored values down so 1.5 ≈ Chromium 1.5 visually (~1.18 here).
 */
function pdfLineHeight(value: number) {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  if (value <= 1.05) return 1;
  return 1 + (value - 1) * 0.36;
}
const HEADING_SIZE: Record<number, number> = {
  1: 20,
  2: 16,
  3: 14,
  4: 12,
  5: 11,
  6: 10,
};

function mm(n: number) {
  return n * MM_TO_PT;
}

function familyName(
  family: string,
  familyMap: Record<string, string>,
): string {
  return familyMap[family] ?? family;
}

type FontAsset = { filename: string; bytes: Buffer };

function dataUrlFont(bytes: Buffer) {
  return "data:font/ttf;base64," + bytes.toString("base64");
}

/** Register only the faces present in `assets` (re-register each render; store replaces). */
export function registerDocumentFonts(
  assets: FontAsset[],
  familyMap: Record<string, string>,
) {
  const byFile = new Map(assets.map((a) => [a.filename, a]));
  const faceSpecs: {
    logical: string;
    weight: number;
    style: "normal" | "italic";
    file: string;
  }[] = [
    { logical: "Calibri", weight: 400, style: "normal", file: "Calibri.ttf" },
    { logical: "Calibri", weight: 700, style: "normal", file: "Calibri-Bold.ttf" },
    { logical: "Calibri", weight: 400, style: "italic", file: "Calibri-Italic.ttf" },
    { logical: "Calibri", weight: 700, style: "italic", file: "Calibri-BoldItalic.ttf" },
    { logical: "Arial", weight: 400, style: "normal", file: "Arial.ttf" },
    { logical: "Arial", weight: 700, style: "normal", file: "Arial-Bold.ttf" },
    { logical: "Arial", weight: 400, style: "italic", file: "Arial-Italic.ttf" },
    { logical: "Arial", weight: 700, style: "italic", file: "Arial-BoldItalic.ttf" },
    { logical: "Helvetica", weight: 400, style: "normal", file: "Helvetica.ttf" },
    { logical: "Helvetica", weight: 700, style: "normal", file: "Helvetica-Bold.ttf" },
    { logical: "Helvetica", weight: 400, style: "italic", file: "Helvetica-Italic.ttf" },
    { logical: "Helvetica", weight: 700, style: "italic", file: "Helvetica-BoldItalic.ttf" },
    { logical: "Times New Roman", weight: 400, style: "normal", file: "TimesNewRoman.ttf" },
    { logical: "Times New Roman", weight: 700, style: "normal", file: "TimesNewRoman-Bold.ttf" },
    { logical: "Times New Roman", weight: 400, style: "italic", file: "TimesNewRoman-Italic.ttf" },
    { logical: "Times New Roman", weight: 700, style: "italic", file: "TimesNewRoman-BoldItalic.ttf" },
    { logical: "Symbol", weight: 400, style: "normal", file: "Symbol.ttf" },
    { logical: "Apple Symbols", weight: 400, style: "normal", file: "AppleSymbols.ttf" },
    { logical: "Wingdings", weight: 400, style: "normal", file: "Wingdings.ttf" },
  ];

  const byFamily = new Map<
    string,
    { src: string; fontWeight: number; fontStyle: "normal" | "italic" }[]
  >();
  for (const face of faceSpecs) {
    const asset = byFile.get(face.file);
    if (!asset) continue;
    const embedded = familyMap[face.logical] ?? face.logical;
    for (const family of new Set([embedded, face.logical])) {
      const list = byFamily.get(family) ?? [];
      if (
        list.some(
          (f) => f.fontWeight === face.weight && f.fontStyle === face.style,
        )
      )
        continue;
      list.push({
        src: dataUrlFont(asset.bytes),
        fontWeight: face.weight,
        fontStyle: face.style,
      });
      byFamily.set(family, list);
    }
  }
  for (const [family, fonts] of byFamily) {
    Font.register({ family, fonts });
  }
}

type Ctx = {
  values: Record<string, string>;
  familyMap: Record<string, string>;
  pageFamily: string;
  pageSize: number;
  inFixed?: boolean;
  inList?: boolean;
};

function isViewChild(node: ReactNode): boolean {
  if (!node || typeof node !== "object" || !("type" in node)) return false;
  const type = (node as ReactElement).type;
  return type === View || type === Checkbox || type === GlyphCheckbox || type === Image || type === Svg;
}

function nodeTextStyle(
  attrs: Record<string, unknown> | undefined,
  ctx: Ctx,
  extra?: Record<string, unknown>,
): Record<string, string | number | undefined> {
  const a = attrs ?? {};
  const style: Record<string, string | number | undefined> = {
    ...(extra as Record<string, string | number | undefined>),
  };
  const family = a.fontFamily;
  if (
    typeof family === "string" &&
    FONT_FAMILIES.includes(family as (typeof FONT_FAMILIES)[number])
  )
    style.fontFamily = familyName(family, ctx.familyMap);
  for (const key of [
    "fontSize",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "textIndent",
    "paddingLeft",
  ] as const) {
    const raw = a[key];
    const n =
      key === "fontSize" && typeof raw === "string" && raw.endsWith("pt")
        ? Number(raw.slice(0, -2))
        : Number(raw);
    if (
      raw !== undefined &&
      raw !== null &&
      Number.isFinite(n) &&
      (key === "textIndent" ? n >= -200 : n >= 0) &&
      n <= 200
    )
      style[key] = key === "fontSize" ? n * FONT_SCALE : n;
  }
  if (a.lineHeight !== undefined && Number.isFinite(Number(a.lineHeight))) {
    const lh = pdfLineHeight(Number(a.lineHeight));
    if (lh !== undefined) style.lineHeight = lh;
  }
  if (["left", "center", "right", "justify"].includes(String(a.textAlign)))
    style.textAlign = String(a.textAlign);
  if (typeof a.color === "string" && /^#[0-9a-f]{6}$/i.test(a.color))
    style.color = a.color;
  return style;
}

function Checkbox({ checked }: { checked: boolean }) {
  return createElement(
    View,
    {
      style: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: "#000",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    checked
      ? createElement(
          Svg,
          { viewBox: "0 0 12 12", width: 10, height: 10 },
          createElement(Path, {
            d: "M2 6L5 9L10 2",
            stroke: "black",
            strokeWidth: 2,
            fill: "none",
          }),
        )
      : null,
  );
}

function GlyphCheckbox({
  checked,
  empty,
  fontSize,
}: {
  checked: boolean;
  empty: boolean;
  fontSize?: number;
}) {
  // Word often stores ☐/☒ at 14pt beside 8pt body text. Size the drawn square
  // to the body x-height (~8pt), not the oversized glyph em-square.
  const authored = fontSize ?? 10;
  const bodyPt = authored >= 12 ? 8 : authored;
  const box = Math.max(6.5, Math.min(9, bodyPt * FONT_SCALE * 0.85));
  // Draw the square with SVG so all four sides stay visible (View borders
  // often drop the right edge under Yoga rounding). No vertical margin — the
  // parent row uses flex-start so the box shares the text cap-line.
  return createElement(
    View,
    {
      style: {
        width: box,
        height: box,
        marginRight: 1.5,
        alignItems: "center",
        justifyContent: "center",
      },
    },
    createElement(
      Svg,
      { viewBox: "0 0 12 12", width: box, height: box },
      createElement(Path, {
        d: "M0.75 0.75H11.25V11.25H0.75Z",
        stroke: "#000",
        strokeWidth: 0.9,
        fill: "none",
      }),
      checked && !empty
        ? createElement(Path, {
            d: "M2.2 2.2L9.8 9.8M9.8 2.2L2.2 9.8",
            stroke: "#000",
            strokeWidth: 1.1,
            fill: "none",
          })
        : null,
    ),
  );
}

function renderInlineText(
  text: string | undefined,
  marks: DocumentNode["marks"],
  ctx: Ctx,
): ReactNode[] {
  const raw = text ?? "";
  const parts: ReactNode[] = [];
  let buffer = "";
  const markFontSize = (() => {
    for (const mark of marks ?? []) {
      if (mark.type !== "textStyle") continue;
      const n =
        typeof mark.attrs?.fontSize === "string" &&
        mark.attrs.fontSize.endsWith("pt")
          ? Number(mark.attrs.fontSize.slice(0, -2))
          : Number(mark.attrs?.fontSize);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return undefined;
  })();
  const flush = (key: string) => {
    if (!buffer) return;
    const chunk = buffer;
    buffer = "";
    let node: ReactNode = chunk;
    const blankUnderline = (marks ?? []).some(
      (mark) =>
        mark.type === "textStyle" &&
        Number(mark.attrs?.blankUnderlineWidth) > 0 &&
        Number(mark.attrs?.blankUnderlineWidth) <= 200,
    );
    const style: Record<string, string | number | undefined> = {};
    for (const mark of marks ?? []) {
      if (mark.type === "bold") style.fontWeight = 700;
      if (mark.type === "italic") style.fontStyle = "italic";
      if (mark.type === "underline" && !blankUnderline)
        style.textDecoration = "underline";
      if (mark.type === "strike") style.textDecoration = "line-through";
      if (mark.type === "textStyle")
        Object.assign(style, nodeTextStyle(mark.attrs, ctx));
      const blankWidth = Number(mark.attrs?.blankUnderlineWidth);
      if (mark.type === "textStyle" && blankWidth > 0) {
        style.borderBottomWidth = 0.5;
        style.borderBottomColor = String(style.color ?? "#000");
        style.width = blankWidth;
        style.minWidth = blankWidth;
      }
    }
    // Checkbox glyphs are often marked 14pt; keep sibling spaces from inflating the line.
    if (/^\s+$/.test(chunk) && Number(style.fontSize) > 9 * FONT_SCALE) {
      style.fontSize = 8 * FONT_SCALE;
      style.lineHeight = 1;
    }
    node = createElement(Text, { key, style: style as never }, chunk);
    parts.push(node);
  };
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === "☐" || ch === "☒" || ch === "☑") {
      flush("t" + i);
      parts.push(
        createElement(GlyphCheckbox, {
          key: "c" + i,
          checked: ch !== "☐",
          empty: ch === "☐",
          fontSize: markFontSize,
        }),
      );
    } else buffer += ch;
  }
  flush("end");
  return parts;
}

function renderNode(node: DocumentNode, ctx: Ctx, key: string): ReactNode {
  if (node.type === "text") {
    const parts = renderInlineText(node.text, node.marks, ctx);
    if (parts.some(isViewChild))
      return createElement(
        View,
        {
          key,
          style: {
            flexDirection: "row",
            flexWrap: "nowrap",
            // flex-start keeps ☐/☒ on the same cap-line as neighbouring text;
            // center/end drop the boxes below the written line.
            alignItems: "flex-start",
            flexShrink: 0,
          },
        },
        ...parts.map((part, index) =>
          isViewChild(part)
            ? part
            : createElement(
                View,
                { key: "t" + index, style: { flexShrink: 0 } },
                part,
              ),
        ),
      );
    return createElement(Text, { key }, ...parts);
  }

  if (node.type === "descriptionPoints") {
    const lines = descriptionPointLines(ctx.values[String(node.attrs?.key)]);
    if (!lines.length) return null;
    const markerSize = ctx.pageSize * FONT_SCALE;
    const markerWidth = Math.max(10, markerSize * 1.15);
    return createElement(
      View,
      { key, style: { ...styles.list, paddingLeft: markerWidth + 6 } },
      lines.map((line, i) =>
        createElement(
          View,
          { key: i, style: styles.listItem, wrap: false },
          createElement(
            Text,
            {
              style: {
                ...styles.bullet,
                width: markerWidth,
                marginLeft: -markerWidth,
                fontSize: markerSize,
              },
            },
            "•",
          ),
          createElement(Text, { style: styles.listText }, line),
        ),
      ),
    );
  }

  if (node.type === "documentField") {
    const fieldKey = String(node.attrs?.key);
    if (node.attrs?.fieldType === "checkbox" && node.attrs.checkboxGlyph) {
      const checked =
        (ctx.values[fieldKey] ?? node.attrs.checkboxValue) === "true";
      return createElement(Checkbox, { key, checked });
    }
    if (node.attrs?.fieldType === "checkbox")
      return createElement(Checkbox, {
        key,
        checked: ctx.values[fieldKey] === "true",
      });
    let value =
      ctx.values[fieldKey] ??
      (node.attrs?.fieldType === "date" && node.attrs?.dateMode === "today"
        ? currentDocumentDate()
        : "");
    if (node.attrs?.fieldType === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value))
      value = value.split("-").reverse().join(".");
    return createElement(
      Text,
      { key },
      ...renderInlineText(value, node.marks, ctx),
    );
  }

  if (node.type === "pageField") {
    const kind = node.attrs?.kind === "pages" ? "pages" : "page";
    const markStyle = node.marks?.find((m) => m.type === "textStyle")?.attrs;
    return createElement(Text, {
      key,
      style: nodeTextStyle(markStyle, ctx) as never,
      render: ({ pageNumber, totalPages }) =>
        String(kind === "pages" ? totalPages : pageNumber),
    });
  }

  if (node.type === "hardBreak") return createElement(Text, { key }, "\n");

  if (node.type === "pageBreak")
    return createElement(Text, { key, break: true }, " ");

  if (node.type === "lineGroup") {
    const height = lineGroupHeight(node);
    const marginTop = Math.max(
      0,
      Math.min(2000, Number(node.attrs?.marginTop) || 0),
    );
    const marginBottom = Math.max(
      0,
      Math.min(2000, Number(node.attrs?.marginBottom) || 0),
    );
    const lines = lineGroupFlowLines(node).slice(0, 50).map((line, i) => {
      const left = Math.max(-2000, Math.min(2000, Number(line.left) || 0));
      const top = Math.max(-2000, Math.min(2000, Number(line.top) || 0));
      const width = Math.max(0, Math.min(2000, Number(line.width) || 0));
      const thickness = Math.max(
        0.25,
        Math.min(10, Number(line.thickness) || 0.5),
      );
      const color = /^#[0-9a-f]{6}$/i.test(String(line.color))
        ? String(line.color)
        : "#000000";
      return createElement(View, {
        key: "l" + i,
        style: {
          position: "absolute",
          left,
          top,
          width,
          borderTopWidth: thickness,
          borderTopColor: color,
        },
      });
    });
    const storedLabels = Array.isArray(node.attrs?.labels)
      ? (node.attrs.labels as Record<string, unknown>[]).slice(0, 100)
      : [];
    const contentLabels = (node.content ?? [])
      .filter((child) => child.type === "lineLabel")
      .slice(0, 100);
    const labels = (
      contentLabels.length ? contentLabels : storedLabels.map(() => null)
    ).map((child, index) => {
      const stored = storedLabels[index];
      const attrs = (stored ?? child?.attrs ?? {}) as Record<string, unknown>;
      const left = Math.max(-2000, Math.min(2000, Number(attrs.left) || 0));
      const top = Math.max(-2000, Math.min(2000, Number(attrs.top) || 0));
      const fontSize = Math.max(4, Math.min(72, Number(attrs.fontSize) || 11));
      const color = /^#[0-9a-f]{6}$/i.test(String(attrs.color))
        ? String(attrs.color)
        : "#000000";
      const family = FONT_FAMILIES.includes(
        attrs.fontFamily as (typeof FONT_FAMILIES)[number],
      )
        ? familyName(String(attrs.fontFamily), ctx.familyMap)
        : familyName(ctx.pageFamily, ctx.familyMap);
      let inner: ReactNode;
      if (stored && Array.isArray(stored.runs)) {
        inner = (stored.runs as { text?: unknown; props?: Record<string, unknown> }[])
          .slice(0, 500)
          .map((run, ri) =>
            createElement(
              Text,
              {
                key: ri,
                style: {
                  ...nodeTextStyle(run.props, ctx),
                  fontWeight: run.props?.bold === true ? 700 : 400,
                  fontStyle: run.props?.italic === true ? "italic" : "normal",
                  textDecoration:
                    run.props?.underline === true ? "underline" : undefined,
                },
              },
              String(run.text ?? ""),
            ),
          );
      } else if (stored) {
        inner = String(stored.text ?? "");
      } else if (child) {
        inner = (child.content ?? []).map((part, pi) =>
          renderNode(part, ctx, "p" + pi),
        );
      } else inner = "";
      // react-pdf does not support CSS translateX; approximate centered labels.
      const label = String(
        stored?.text ??
          (Array.isArray(stored?.runs)
            ? (stored!.runs as { text?: string }[])
                .map((r) => r.text ?? "")
                .join("")
            : ""),
      );
      const approxWidth =
        attrs.centered === true
          ? Math.max(label.length, 1) * fontSize * 0.45
          : 0;
      return createElement(
        Text,
        {
          key: "lb" + index,
          style: {
            position: "absolute",
            left: attrs.centered === true ? left - approxWidth / 2 : left,
            top,
            fontFamily: family,
            fontSize,
            lineHeight: LINE_LABEL_LINE_HEIGHT,
            color,
            fontWeight: attrs.bold === true ? 700 : 400,
            fontStyle: attrs.italic === true ? "italic" : "normal",
            textDecoration: attrs.underline === true ? "underline" : undefined,
          },
        },
        inner,
      );
    });
    return createElement(
      View,
      {
        key,
        wrap: false,
        style: {
          position: "relative",
          height,
          marginTop,
          marginBottom,
          lineHeight: 1.5,
        },
      },
      ...lines,
      ...labels,
    );
  }

  if (node.type === "image") {
    const src = String(node.attrs?.src ?? "");
    if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src))
      return null;
    const width = Number(node.attrs?.width);
    return createElement(Image, {
      key,
      src,
      style: {
        maxWidth: "100%",
        ...(width > 0 && width <= 2000 ? { width } : {}),
      },
    });
  }

  // Approximate CSS margin collapsing: drop marginTop on blocks after the first.
  const collapseMargins = (child: DocumentNode, index: number): DocumentNode => {
    if (
      index === 0 ||
      !child.attrs ||
      !["paragraph", "heading", "bulletList", "orderedList", "blockquote", "table", "lineGroup"].includes(
        child.type,
      )
    )
      return child;
    if (!child.attrs.marginTop) return child;
    const { marginTop: _drop, ...attrs } = child.attrs;
    return { ...child, attrs };
  };

  const isEmptyParagraph = (child: DocumentNode) =>
    child.type === "paragraph" &&
    !(child.content ?? []).some(
      (part) =>
        (part.type === "text" && String(part.text ?? "").length > 0) ||
        part.type === "documentField" ||
        part.type === "image" ||
        (part.content?.length ?? 0) > 0,
    );

  const children = (() => {
    const source = node.content ?? [];
    if (node.type !== "doc")
      return source.map((child, i) => renderNode(child, ctx, String(i)));
    const out: ReactNode[] = [];
    let emptyRun = 0;
    for (let i = 0; i < source.length; i++) {
      const child = collapseMargins(source[i]!, i);
      if (isEmptyParagraph(child)) {
        emptyRun++;
        const next = source[i + 1];
        if (next && isEmptyParagraph(next)) continue;
        // Chromium collapses adjacent empty <p><br></p> tightly; keep a short spacer.
        // Tiny preserveEmpty runs (8pt signature gaps) are nearly invisible in Chromium.
        const size = Number(child.attrs?.fontSize) || ctx.pageSize;
        if (size <= 8 && emptyRun <= 2) {
          emptyRun = 0;
          continue;
        }
        out.push(
          createElement(View, {
            key: "e" + i,
            style: {
              height: Math.max(2, size * 0.15 * Math.min(emptyRun, 2)),
            },
          }),
        );
        emptyRun = 0;
        continue;
      }
      emptyRun = 0;
      out.push(renderNode(child, ctx, String(i)));
    }
    return out;
  })();

  if (node.type === "doc") return createElement(View, { key }, ...children);

  if (node.type === "paragraph") {
    const empty = !(node.content ?? []).length;
    const baseStyle = {
      ...styles.paragraph,
      ...nodeTextStyle(node.attrs, ctx),
      fontFamily: familyName(
        String(node.attrs?.fontFamily ?? ctx.pageFamily),
        ctx.familyMap,
      ),
      // Apply after attrs: Word stores marginTop on <li><p> which otherwise
      // drops the text below the list marker / checkbox baseline.
      ...(ctx.inList ? { marginBottom: 0, marginTop: 0 } : {}),
    };
    if (empty) {
      // Match Chromium empty <p><br></p> without Yoga's heavier Text line box.
      const size =
        Number((baseStyle as { fontSize?: number }).fontSize) || ctx.pageSize;
      return createElement(View, {
        key,
        style: {
          height: Math.max(4, size * 0.45),
          marginBottom: 0,
        },
      });
    }
    // Fixed headers/footers with pageNumber render() must not nest inside Text.
    if (children.some(isViewChild) || ctx.inFixed) {
      // react-pdf Text siblings in a row often expand to 100% width and force
      // following checkbox Views onto the next line. Shrink-wrap each run.
      const inline = children.map((child, index) =>
        isViewChild(child)
          ? child
          : createElement(
              View,
              {
                key: "tw" + index,
                style: { flexShrink: 0, maxWidth: "100%" },
              },
              child,
            ),
      );
      return createElement(
        View,
        {
          key,
          style: {
            ...baseStyle,
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent:
              node.attrs?.textAlign === "right"
                ? "flex-end"
                : node.attrs?.textAlign === "center"
                  ? "center"
                  : "flex-start",
          },
        },
        ...inline,
      );
    }
    return createElement(Text, { key, style: baseStyle }, ...children);
  }

  if (node.type === "heading") {
    const level = Math.min(6, Math.max(1, Number(node.attrs?.level) || 1));
    return createElement(
      Text,
      {
        key,
        style: {
          ...styles.heading,
          fontSize: HEADING_SIZE[level]! * FONT_SCALE,
          ...nodeTextStyle(node.attrs, ctx),
          fontFamily: familyName(
            String(node.attrs?.fontFamily ?? ctx.pageFamily),
            ctx.familyMap,
          ),
          fontWeight: 700,
        },
      },
      ...children,
    );
  }

  if (node.type === "bulletList" || node.type === "orderedList") {
    const start =
      node.type === "orderedList" &&
      Number.isInteger(Number(node.attrs?.start)) &&
      Number(node.attrs?.start) > 0
        ? Number(node.attrs?.start)
        : 1;
    const listCtx = { ...ctx, inList: true };
    const listFont =
      (Number(node.attrs?.fontSize) > 0
        ? Number(node.attrs?.fontSize)
        : ctx.pageSize) * FONT_SCALE;
    // HTML padding-left is the text indent; the marker hangs inside that gutter.
    const padLeft = Math.max(
      0,
      Math.min(200, Number(node.attrs?.paddingLeft) || 20),
    );
    const markerWidth = Math.max(
      listFont * (node.type === "orderedList" ? 1.35 : 1.0),
      node.type === "orderedList" ? 10 : 8,
    );
    const listStyle = nodeTextStyle(node.attrs, ctx);
    delete listStyle.paddingLeft;
    delete listStyle.fontSize;
    const listType = String(node.attrs?.listStyleType ?? "disc");
    return createElement(
      View,
      {
        key,
        style: {
          ...styles.list,
          ...listStyle,
          paddingLeft: Math.max(padLeft, markerWidth + 2),
          marginBottom: 1,
          fontSize: listFont,
        },
      },
      (node.content ?? []).map((item, i) => {
        const marker =
          node.type === "orderedList"
            ? String(start + i) + "."
            : listType === "dash"
              ? "–"
              : listType === "circle"
                ? "◦"
                : listType === "square"
                  ? "▪"
                  : "•";
        // Preserve Word's per-item spacing on the row, not the inner <p>, so the
        // marker stays on the same line as the first text run.
        const first = item.content?.[0];
        const itemTop =
          first?.type === "paragraph"
            ? Math.max(0, Math.min(200, Number(first.attrs?.marginTop) || 0))
            : 0;
        return createElement(
          View,
          {
            key: i,
            style: { ...styles.listItem, marginTop: itemTop },
            wrap: false,
          },
          createElement(
            Text,
            {
              style: {
                ...styles.bullet,
                width: markerWidth,
                marginLeft: -markerWidth,
                fontSize: listFont,
                color: listStyle.color,
                lineHeight: 1.12,
              },
            },
            marker,
          ),
          createElement(
            View,
            { style: styles.listText },
            ...(item.content ?? []).map((c, ci) =>
              renderNode(c, listCtx, String(ci)),
            ),
          ),
        );
      }),
    );
  }

  if (node.type === "listItem")
    return createElement(View, { key }, ...children);

  if (node.type === "blockquote")
    return createElement(
      View,
      { key, style: { ...styles.blockquote, ...nodeTextStyle(node.attrs, ctx) } },
      ...children,
    );

  if (node.type === "table") {
    const border = node.attrs?.border;
    const box = border === "box";
    const none = border === "none";
    const boxWidth = Number(node.attrs?.boxWidth);
    const hasBoxWidth = boxWidth > 0 && boxWidth <= 2000;
    const tableStyle = nodeTextStyle(node.attrs, ctx);
    // boxWidth is authored in pt (HTML path); don't also stretch to 100%.
    delete tableStyle.width;
    const padX = none ? 0 : 4;
    return createElement(
      View,
      {
        key,
        style: {
          width: hasBoxWidth ? boxWidth : "100%",
          maxWidth: "100%",
          ...tableStyle,
          ...(box
            ? {
                borderWidth: 0.75,
                borderLeftWidth: 0.75,
                borderRightWidth: 0.75,
                borderTopWidth: 0.75,
                borderBottomWidth: 0.75,
                borderColor: "#000",
                borderStyle: "solid",
              }
            : {}),
        },
      },
      (node.content ?? []).map((row, ri) => {
        const cells = row.content ?? [];
        const rawWidths = cells.map((cell) => {
          const colwidth = Array.isArray(cell.attrs?.colwidth)
            ? Number(cell.attrs!.colwidth[0])
            : 0;
          return colwidth > 0 && colwidth <= 3000 ? colwidth : 0;
        });
        const rawSum = rawWidths.reduce((a, b) => a + b, 0);
        // TipTap stores colwidth in CSS px; HTML uses width:Npx. 1px ≈ 0.75pt.
        const targetWidth = hasBoxWidth
          ? boxWidth
          : rawSum > 0
            ? rawSum * 0.75
            : undefined;
        return createElement(
          View,
          {
            key: ri,
            wrap: false,
            style: { flexDirection: "row", width: "100%" },
          },
          cells.map((cell, ci) => {
            let cellWidth: number | undefined;
            if (targetWidth && rawSum > 0 && rawWidths[ci]! > 0) {
              cellWidth = (rawWidths[ci]! / rawSum) * targetWidth;
            } else if (rawWidths[ci]! > 0) {
              cellWidth = rawWidths[ci]! * 0.75;
            }
            // Yoga width is content-box; keep padding inside the border.
            const contentWidth =
              cellWidth !== undefined
                ? Math.max(4, cellWidth - padX * 2)
                : undefined;
            return createElement(
              View,
              {
                key: ci,
                style: {
                  flexGrow: contentWidth ? 0 : 1,
                  flexShrink: 1,
                  flexBasis: contentWidth ?? 0,
                  width: contentWidth,
                  borderWidth: none || box ? 0 : 0.75,
                  borderColor: "#aaaaaa",
                  paddingTop: none ? 0 : box ? 1 : 3,
                  paddingBottom: none ? 0 : box ? 1 : 3,
                  paddingLeft: none ? 0 : padX,
                  paddingRight: none ? 0 : padX,
                  justifyContent: "flex-start",
                  ...nodeTextStyle(cell.attrs, ctx),
                },
              },
              ...(cell.content ?? []).map((c, cii) =>
                renderNode(c, ctx, String(cii)),
              ),
            );
          }),
        );
      }),
    );
  }

  if (
    node.type === "tableRow" ||
    node.type === "tableCell" ||
    node.type === "tableHeader"
  )
    return createElement(View, { key }, ...children);

  return createElement(View, { key }, ...children);
}

function sectionHasContent(section: DocumentNode) {
  return Boolean(
    section.content?.some(
      (node) => node.content?.length || node.type === "image",
    ),
  );
}

function flattenInlineNodes(
  node: DocumentNode,
  ctx: Ctx,
  keyPrefix: string,
): ReactNode[] {
  if (node.type === "doc" || node.type === "paragraph") {
    const align = node.attrs?.textAlign;
    const kids = (node.content ?? []).flatMap((child, i) =>
      flattenInlineNodes(child, ctx, keyPrefix + i),
    );
    if (node.type === "doc") return kids;
    return [
      createElement(
        View,
        {
          key: keyPrefix,
          style: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent:
              align === "right"
                ? "flex-end"
                : align === "center"
                  ? "center"
                  : "flex-start",
            width: "100%",
          },
        },
        ...kids,
      ),
    ];
  }
  if (node.type === "text")
    return [
      createElement(Text, { key: keyPrefix }, ...(renderInlineText(node.text, node.marks, ctx) as ReactNode[])),
    ];
  if (node.type === "pageField") {
    const kind = node.attrs?.kind === "pages" ? "pages" : "page";
    const markStyle = node.marks?.find((m) => m.type === "textStyle")?.attrs;
    return [
      createElement(Text, {
        key: keyPrefix,
        style: nodeTextStyle(markStyle, ctx) as never,
        render: ({
          pageNumber,
          totalPages,
        }: {
          pageNumber: number;
          totalPages: number;
        }) =>
          String(
            kind === "pages"
              ? totalPages || ""
              : pageNumber || "",
          ),
      }),
    ];
  }
  if (node.type === "documentField" || node.type === "hardBreak")
    return [renderNode(node, ctx, keyPrefix)];
  return (node.content ?? []).flatMap((child, i) =>
    flattenInlineNodes(child, ctx, keyPrefix + i),
  );
}

function HeaderFooter({
  section,
  ctx,
  position,
  page,
}: {
  section: DocumentNode;
  ctx: Ctx;
  position: "header" | "footer";
  page: StyledDocument["page"];
}) {
  if (!sectionHasContent(section)) return null;
  const top =
    position === "header"
      ? mm(10)
      : mm(page.height - page.marginBottom + 4);
  return createElement(
    View,
    {
      fixed: true,
      style: {
        position: "absolute",
        left: mm(page.marginLeft),
        top,
        width: mm(page.width - page.marginLeft - page.marginRight),
        fontFamily: familyName(page.fontFamily, ctx.familyMap),
        fontSize: page.fontSize,
      },
    },
    ...flattenInlineNodes(section, ctx, position),
  );
}

const styles = StyleSheet.create({
  // Chromium DOCUMENT_CSS: p margin 0 0 8pt, body line-height 1.5.
  // react-pdf line boxes measure taller than Chromium for the same CSS numbers,
  // so defaults are tightened until golden page fills match.
  paragraph: {
    marginTop: 0,
    marginBottom: 2.5,
    lineHeight: 1.12,
    color: "#111",
  },
  heading: {
    marginTop: 0,
    marginBottom: 4,
    lineHeight: 1.15,
    color: "#111",
  },
  list: {
    marginBottom: 1,
    paddingLeft: 18,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 0,
  },
  bullet: {
    width: 12,
    fontSize: 8,
    lineHeight: 1.12,
  },
  listText: {
    flex: 1,
    // Keep the first text line flush with the marker (no extra Yoga offset).
    justifyContent: "flex-start",
  },
  blockquote: {
    marginBottom: 6,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#aaa",
  },
});

function splitByPageBreaks(content: DocumentNode): DocumentNode[][] {
  const blocks = content.content ?? [];
  const chunks: DocumentNode[][] = [[]];
  for (const block of blocks) {
    if (block.type === "pageBreak") {
      chunks.push([]);
      continue;
    }
    chunks[chunks.length - 1]!.push(block);
  }
  return chunks.filter((chunk, index) => chunk.length > 0 || index === 0);
}

export function buildDocumentElement(
  document: StyledDocument,
  values: Record<string, string>,
  familyMap: Record<string, string>,
): ReactElement {
  const page = document.page;
  const ctx: Ctx = {
    values,
    familyMap,
    pageFamily: page.fontFamily,
    pageSize: page.fontSize,
  };
  // Chromium's used print width is slightly wider than Yoga's content box for the
  // same mm margins (scrollbar/rounding). Nudge horizontal padding so wraps match.
  const pageStyle = {
    paddingTop: mm(page.marginTop),
    paddingBottom: mm(page.marginBottom),
    paddingLeft: Math.max(0, mm(page.marginLeft) - 2),
    paddingRight: Math.max(0, mm(page.marginRight) - 2),
    fontFamily: familyName(page.fontFamily, familyMap),
    // Slight optical downscale: Yoga metrics run a hair larger than Chromium for
    // the same TTF, which otherwise adds ~1 page on long contracts.
    fontSize: page.fontSize * FONT_SCALE,
    lineHeight: 1.08,
    color: "#111",
    backgroundColor: "#fff",
  };
  const chunks = splitByPageBreaks(document.content);
  return createElement(
    Document,
    null,
    ...chunks.map((chunk, index) =>
      createElement(
        Page,
        {
          key: "p" + index,
          size: { width: mm(page.width), height: mm(page.height) },
          style: pageStyle,
          wrap: true,
        },
        createElement(HeaderFooter, {
          section: document.header,
          ctx,
          position: "header",
          page,
        }),
        createElement(HeaderFooter, {
          section: document.footer,
          ctx,
          position: "footer",
          page,
        }),
        renderNode({ type: "doc", content: chunk }, ctx, "body" + index),
      ),
    ),
  );
}

export async function renderStyledDocumentPdf(
  document: StyledDocument,
  values: Record<string, string>,
  fonts: {
    assets: FontAsset[];
    familyMap: Record<string, string>;
  },
): Promise<Buffer> {
  registerDocumentFonts(fonts.assets, fonts.familyMap ?? {});
  const element = buildDocumentElement(
    document,
    values,
    fonts.familyMap ?? {},
  );
  const instance = pdf(element as never);
  // toBuffer() returns a Node readable stream (misnamed API).
  const stream = (await instance.toBuffer()) as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
  return Buffer.concat(chunks);
}
