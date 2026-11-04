import { createElement, type ReactElement, type ReactNode } from "react";
import { createCanvas } from "@napi-rs/canvas";
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
// Chromium's print font advances measure 1.37% below React-PDF with the same
// embedded faces. Keep this small cross-engine calibration uniform; never vary
// typography with field values or document text.
const FONT_SCALE = 0.9863;
function pdfLineHeight(value: number) {
  return Number.isFinite(value) && value > 0 ? value : undefined;
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

const underlineImages = new Map<string, string>();
function underlineImage(color: string, width: number) {
  const key = `${color}:${width}`;
  const cached = underlineImages.get(key);
  if (cached) return cached;
  // Inline attachments preserve aspect ratio, so the bitmap must itself have
  // the aspect ratio of the requested half-point rule.
  const canvas = createCanvas(Math.max(1, Math.round(width * 2)), 1);
  const context = canvas.getContext("2d");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const src = canvas.toDataURL("image/png");
  underlineImages.set(key, src);
  return src;
}

function familyName(family: string, familyMap: Record<string, string>): string {
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
    {
      logical: "Calibri",
      weight: 700,
      style: "normal",
      file: "Calibri-Bold.ttf",
    },
    {
      logical: "Calibri",
      weight: 400,
      style: "italic",
      file: "Calibri-Italic.ttf",
    },
    {
      logical: "Calibri",
      weight: 700,
      style: "italic",
      file: "Calibri-BoldItalic.ttf",
    },
    { logical: "Arial", weight: 400, style: "normal", file: "Arial.ttf" },
    { logical: "Arial", weight: 700, style: "normal", file: "Arial-Bold.ttf" },
    {
      logical: "Arial",
      weight: 400,
      style: "italic",
      file: "Arial-Italic.ttf",
    },
    {
      logical: "Arial",
      weight: 700,
      style: "italic",
      file: "Arial-BoldItalic.ttf",
    },
    {
      logical: "Helvetica",
      weight: 400,
      style: "normal",
      file: "Helvetica.ttf",
    },
    {
      logical: "Helvetica",
      weight: 700,
      style: "normal",
      file: "Helvetica-Bold.ttf",
    },
    {
      logical: "Helvetica",
      weight: 400,
      style: "italic",
      file: "Helvetica-Italic.ttf",
    },
    {
      logical: "Helvetica",
      weight: 700,
      style: "italic",
      file: "Helvetica-BoldItalic.ttf",
    },
    {
      logical: "Times New Roman",
      weight: 400,
      style: "normal",
      file: "TimesNewRoman.ttf",
    },
    {
      logical: "Times New Roman",
      weight: 700,
      style: "normal",
      file: "TimesNewRoman-Bold.ttf",
    },
    {
      logical: "Times New Roman",
      weight: 400,
      style: "italic",
      file: "TimesNewRoman-Italic.ttf",
    },
    {
      logical: "Times New Roman",
      weight: 700,
      style: "italic",
      file: "TimesNewRoman-BoldItalic.ttf",
    },
    { logical: "Symbol", weight: 400, style: "normal", file: "Symbol.ttf" },
    {
      logical: "Apple Symbols",
      weight: 400,
      style: "normal",
      file: "AppleSymbols.ttf",
    },
    {
      logical: "Wingdings",
      weight: 400,
      style: "normal",
      file: "Wingdings.ttf",
    },
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
  inCheckboxRow?: boolean;
  lineHeight?: number;
};

function isViewChild(node: ReactNode): boolean {
  if (!node || typeof node !== "object" || !("type" in node)) return false;
  const type = (node as ReactElement).type;
  return (
    type === View ||
    type === Checkbox ||
    type === GlyphCheckbox ||
    type === Image ||
    type === Svg
  );
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
  // Match Chromium printText(): ☐/☒ keep a glyph-sized advance (~0.78em of the
  // authored mark, often 14pt) while the drawn square sits near 8pt body size.
  // Same advance on lineGroup + paragraph rows so the following text lines up.
  const authored = Math.max(7, fontSize ?? 10);
  const em = authored * FONT_SCALE;
  const slot = Math.max(7, em * (authored >= 12 ? 0.78 : 0.9));
  const drawn = Math.max(6.5, Math.min(slot * 0.75, 8.5));
  const inset = Math.max(0, drawn < slot ? (em * 0.5 - drawn) / 2 : 0);
  return createElement(
    View,
    {
      style: {
        width: slot,
        height: drawn,
        marginTop: inset,
        // Remaining slot width is the Chromium "breathing room" before the label.
        marginRight: 0,
        alignItems: "flex-start",
        justifyContent: "flex-start",
      },
    },
    createElement(
      Svg,
      { viewBox: "0 0 12 12", width: drawn, height: drawn },
      createElement(Path, {
        d: "M0.75 0.75H11.25V11.25H0.75Z",
        stroke: "#000",
        strokeWidth: 0.85,
        fill: "none",
      }),
      checked && !empty
        ? createElement(Path, {
            d: "M2.2 2.2L9.8 9.8M9.8 2.2L2.2 9.8",
            stroke: "#000",
            strokeWidth: 1.05,
            fill: "none",
          })
        : null,
    ),
  );
}

/** Carlito/Arial often lack ☐/☒; always draw them as SVG (lineGroup + paragraphs). */
function nodesForTextWithCheckboxes(
  raw: string,
  style: Record<string, string | number | undefined>,
  keyPrefix: string,
  checkboxFontSize?: number,
): ReactNode[] {
  const parts: ReactNode[] = [];
  let buffer = "";
  const flush = (key: string) => {
    if (!buffer) return;
    parts.push(createElement(Text, { key, style: style as never }, buffer));
    buffer = "";
  };
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!;
    if (ch === "☐" || ch === "☒" || ch === "☑") {
      flush(keyPrefix + "t" + i);
      parts.push(
        createElement(GlyphCheckbox, {
          key: keyPrefix + "c" + i,
          checked: ch !== "☐",
          empty: ch === "☐",
          fontSize: checkboxFontSize,
        }),
      );
    } else buffer += ch;
  }
  flush(keyPrefix + "end");
  return parts;
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
    }
    const blankWidth = Number(
      marks?.find(
        (mark) =>
          mark.type === "textStyle" &&
          Number(mark.attrs?.blankUnderlineWidth) > 0,
      )?.attrs?.blankUnderlineWidth,
    );
    if (blankUnderline && !chunk.trim()) {
      // Nested Text borders/widths are ignored by React-PDF. An inline image
      // attachment reserves the exact authored advance and paints the rule on
      // the text baseline, including in right-aligned cells and wrapped text.
      parts.push(
        createElement(
          Text,
          { key, style: style as never },
          createElement(Image, {
            src: underlineImage(String(style.color ?? "#000000"), blankWidth),
            style: { width: blankWidth, height: 0.5 },
          }),
        ),
      );
      return;
    }
    if (blankUnderline) style.textDecoration = "underline";
    // Checkbox glyphs are often marked 14pt; keep sibling spaces from inflating the line.
    if (
      ctx.inCheckboxRow &&
      /^\s+$/.test(chunk) &&
      Number(style.fontSize) > 9 * FONT_SCALE
    ) {
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
  if (node.type === "paragraph") {
    ctx = {
      ...ctx,
      inCheckboxRow: (node.content ?? []).some(
        (part) =>
          /[☐☒☑]/.test(part.text ?? "") || part.attrs?.fieldType === "checkbox",
      ),
    };
  }
  if (
    [
      "bulletList",
      "orderedList",
      "blockquote",
      "table",
      "tableCell",
      "tableHeader",
    ].includes(node.type)
  ) {
    ctx = {
      ...ctx,
      pageSize: Number(node.attrs?.fontSize) || ctx.pageSize,
      lineHeight: Number(node.attrs?.lineHeight) || ctx.lineHeight,
    };
  }
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
    const lines = lineGroupFlowLines(node)
      .slice(0, 50)
      .map((line, i) => {
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
      const runNodes: ReactNode[] = [];
      if (stored && Array.isArray(stored.runs)) {
        const runs = (
          stored.runs as {
            text?: unknown;
            props?: Record<string, unknown>;
          }[]
        ).slice(0, 500);
        for (const [ri, run] of runs.entries()) {
          const runStyle: Record<string, string | number | undefined> = {
            ...nodeTextStyle(run.props, ctx),
            fontWeight: run.props?.bold === true ? 700 : 400,
            fontStyle: run.props?.italic === true ? "italic" : "normal",
            textDecoration:
              run.props?.underline === true ? "underline" : undefined,
          };
          const runFont =
            Number(run.props?.fontSize) > 0
              ? Number(run.props?.fontSize)
              : fontSize;
          const text = String(run.text ?? "");
          // Word stores a 14pt space after ☐; paragraph rows have no gap after
          // the SVG. Drop that spacer so both option lines share one text column.
          const prev = runs[ri - 1];
          const prevText = String(prev?.text ?? "");
          if (/^\s+$/.test(text) && /[☐☒☑]/.test(prevText) && runFont >= 12) {
            continue;
          }
          if (/[☐☒☑]/.test(text)) {
            for (const part of nodesForTextWithCheckboxes(
              text,
              runStyle,
              "lb" + index + "r" + ri,
              runFont,
            )) {
              runNodes.push(
                isViewChild(part)
                  ? part
                  : createElement(
                      View,
                      {
                        key: "lb" + index + "w" + ri + runNodes.length,
                        style: { flexShrink: 0 },
                      },
                      part,
                    ),
              );
            }
          } else {
            // Body copy next to ☐ is 8pt; don't let a 14pt run inflate the row.
            if (
              runs.some((run) => /[☐☒☑]/.test(String(run.text ?? ""))) &&
              /^\s+$/.test(text) &&
              Number(runStyle.fontSize) > 9 * FONT_SCALE
            ) {
              runStyle.fontSize = 8 * FONT_SCALE;
              runStyle.lineHeight = 1;
            }
            runNodes.push(
              createElement(
                Text,
                { key: "lb" + index + "r" + ri, style: runStyle as never },
                text,
              ),
            );
          }
        }
      } else if (stored) {
        const text = String(stored.text ?? "");
        if (/[☐☒☑]/.test(text)) {
          runNodes.push(
            ...nodesForTextWithCheckboxes(
              text,
              {},
              "lb" + index + "t",
              fontSize,
            ),
          );
        } else runNodes.push(text);
      } else if (child) {
        runNodes.push(
          ...(child.content ?? []).map((part, pi) =>
            renderNode(part, ctx, "p" + pi),
          ),
        );
      }
      // SVG checkboxes cannot nest inside Text — use a row View.
      if (runNodes.some(isViewChild)) {
        return createElement(
          View,
          {
            key: "lb" + index,
            style: {
              position: "absolute",
              left: attrs.centered === true ? 0 : left,
              width: attrs.centered === true ? left * 2 : undefined,
              justifyContent: attrs.centered === true ? "center" : "flex-start",
              top,
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "flex-start",
              fontFamily: family,
              // Use body size on the row so a 14pt ☐ mark does not stretch height.
              fontSize: Math.min(fontSize, 8),
              lineHeight: 1.15,
              color,
            },
          },
          ...runNodes.map((part, pi) =>
            isViewChild(part)
              ? part
              : createElement(
                  View,
                  { key: "lbt" + index + pi, style: { flexShrink: 0 } },
                  typeof part === "string"
                    ? createElement(Text, null, part)
                    : part,
                ),
          ),
        );
      }
      return createElement(
        Text,
        {
          key: "lb" + index,
          style: {
            position: "absolute",
            left: attrs.centered === true ? 0 : left,
            width: attrs.centered === true ? left * 2 : undefined,
            textAlign: attrs.centered === true ? "center" : "left",
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
        ...runNodes,
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
        ...(width > 0 && width <= 2000 ? { width: width * 0.75 } : {}),
      },
    });
  }

  const source = node.content ?? [];
  const children = source.map((child, index) => {
    if (node.type !== "doc" || index === 0)
      return renderNode(child, ctx, String(index));
    // CSS collapses adjoining vertical block margins to their maximum.
    const previous = source[index - 1]!;
    const defaultBottom = (type: string) =>
      [
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "blockquote",
      ].includes(type)
        ? 8
        : 0;
    const bottom = Number(
      previous.attrs?.marginBottom ?? defaultBottom(previous.type),
    );
    const top = Number(child.attrs?.marginTop ?? 0);
    return renderNode(
      {
        ...child,
        attrs: { ...child.attrs, marginTop: Math.max(0, top - bottom) },
      },
      ctx,
      String(index),
    );
  });

  if (node.type === "doc") return createElement(View, { key }, ...children);

  if (node.type === "paragraph") {
    const empty = !(node.content ?? []).length;
    const baseStyle = {
      ...styles.paragraph,
      fontSize: ctx.pageSize * FONT_SCALE,
      lineHeight: ctx.lineHeight ?? 1.5,
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
      // A preserved empty paragraph still contributes its authored line box.
      const size =
        Number((baseStyle as { fontSize?: number }).fontSize) || ctx.pageSize;
      return createElement(View, {
        key,
        style: {
          ...baseStyle,
          height:
            size * (Number(node.attrs?.lineHeight) || ctx.lineHeight || 1.5),
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
        minPresenceAhead: 24,
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
    const listCtx = {
      ...ctx,
      inList: true,
      pageSize: Number(node.attrs?.fontSize) || ctx.pageSize,
    };
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
                color:
                  typeof listStyle.color === "string"
                    ? listStyle.color
                    : undefined,
                lineHeight: 1.5,
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
      {
        key,
        style: { ...styles.blockquote, ...nodeTextStyle(node.attrs, ctx) },
      },
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
            ...nodeTextStyle(node.attrs, ctx),
            fontSize: Number(node.attrs?.fontSize) || ctx.pageSize,
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
      createElement(
        Text,
        { key: keyPrefix },
        ...(renderInlineText(node.text, node.marks, ctx) as ReactNode[]),
      ),
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
        }) => String(kind === "pages" ? totalPages || "" : pageNumber || ""),
      }),
    ];
  }
  if (node.type === "image") return [renderNode(node, ctx, keyPrefix)];
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
  const footerHeight = (section.content ?? []).reduce((height, node) => {
    if (!node.content?.length) return height;
    const size = Number(node.attrs?.fontSize) || page.fontSize;
    return (
      height +
      size * FONT_SCALE * (Number(node.attrs?.lineHeight) || 1.5) +
      Number(node.attrs?.marginTop || 0) +
      Number(node.attrs?.marginBottom || 0)
    );
  }, 0);
  const top =
    position === "header"
      ? mm(5)
      : Math.min(
          mm(page.height - page.marginBottom + 4),
          mm(page.height - 4) - footerHeight,
        );
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
  // Keep defaults aligned with shared DOCUMENT_CSS.
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
    lineHeight: 1.5,
    color: "#111",
  },
  heading: {
    marginTop: 0,
    marginBottom: 8,
    lineHeight: 1.5,
    color: "#111",
  },
  list: {
    marginBottom: 8,
    paddingLeft: 20,
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
  const pageStyle = {
    paddingTop: mm(page.marginTop),
    paddingBottom: mm(page.marginBottom),
    paddingLeft: mm(page.marginLeft),
    paddingRight: mm(page.marginRight),
    fontFamily: familyName(page.fontFamily, familyMap),
    fontSize: page.fontSize * FONT_SCALE,
    lineHeight: 1.5,
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
  // Browser print does not insert dictionary hyphens into authored words.
  Font.registerHyphenationCallback((word) => [word]);
  registerDocumentFonts(fonts.assets, fonts.familyMap ?? {});
  const element = buildDocumentElement(document, values, fonts.familyMap ?? {});
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
