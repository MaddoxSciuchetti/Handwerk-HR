import {
  documentFields,
  fieldComplete,
  type DocumentNode,
  type StyledDocument,
} from "./document";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export const FONT_FAMILIES = [
  "Calibri",
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Symbol",
  "Apple Symbols",
  "Wingdings",
] as const;
export function nodeStyle(node: DocumentNode): string {
  const a = node.attrs ?? {};
  const rules: string[] = [];
  if (FONT_FAMILIES.includes(a.fontFamily as (typeof FONT_FAMILIES)[number]))
    rules.push("font-family:" + a.fontFamily);
  for (const key of [
    "fontSize",
    "marginTop",
    "marginBottom",
    "marginLeft",
    "marginRight",
    "textIndent",
    "lineHeight",
    "paddingLeft",
  ]) {
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
      rules.push(
        key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) +
          ":" +
          n +
          (key === "lineHeight" ? "" : "pt"),
      );
  }
  if (["left", "center", "right", "justify"].includes(String(a.textAlign)))
    rules.push("text-align:" + a.textAlign);
  if (typeof a.color === "string" && /^#[0-9a-f]{6}$/i.test(a.color))
    rules.push("color:" + a.color);
  const listStyles: Record<string, string> = {
    disc: "disc",
    circle: "circle",
    square: "square",
    dash: '"- "',
  };
  if (
    typeof a.listStyleType === "string" &&
    Object.hasOwn(listStyles, a.listStyleType)
  )
    rules.push("list-style-type:" + listStyles[a.listStyleType]);
  if (Number(a.blankUnderlineWidth) > 0 && Number(a.blankUnderlineWidth) <= 200)
    rules.push(
      "display:inline-block",
      "width:" + Number(a.blankUnderlineWidth) + "pt",
      "border-bottom:0.5pt solid currentColor",
      "line-height:1",
      "text-decoration:none",
    );
  if (
    node.type === "table" &&
    Number(a.boxWidth) > 0 &&
    Number(a.boxWidth) <= 2000
  )
    rules.push(
      "width:" + Number(a.boxWidth) + "pt",
      "max-width:calc(100% - " +
        Math.max(0, Math.min(200, Number(a.marginLeft) || 0)) +
        "pt)",
    );
  if (
    ["tableCell", "tableHeader"].includes(node.type) &&
    Array.isArray(a.colwidth) &&
    a.colwidth.length === 1 &&
    Number(a.colwidth[0]) > 0 &&
    Number(a.colwidth[0]) <= 3000
  )
    rules.push("width:" + Number(a.colwidth[0]) + "px");
  return rules.join(";");
}

export function lineLabelRunStyle(props: Record<string, unknown>): string {
  return (
    nodeStyle({ type: "text", attrs: props }) +
    (props.bold === true ? ";font-weight:700" : ";font-weight:400") +
    (props.italic === true ? ";font-style:italic" : ";font-style:normal") +
    (props.underline === true ? ";text-decoration:underline" : "")
  );
}

function inlineText(node: DocumentNode): string {
  return (node.content ?? [])
    .map((child) => child.text ?? inlineText(child))
    .join("");
}

function storedLabelText(label: Record<string, unknown>): string {
  if (Array.isArray(label.runs))
    return label.runs
      .map((run) => String((run as { text?: unknown }).text ?? ""))
      .join("");
  return String(label.text ?? "");
}

function positionedLabelHtml(
  attrs: Record<string, unknown>,
  inner: string,
): string {
  const left = Math.max(-2000, Math.min(2000, Number(attrs.left) || 0));
  const top = Math.max(-2000, Math.min(2000, Number(attrs.top) || 0));
  const fontSize = Math.max(4, Math.min(72, Number(attrs.fontSize) || 11));
  const color = /^#[0-9a-f]{6}$/i.test(String(attrs.color))
    ? String(attrs.color)
    : "#000000";
  const family = FONT_FAMILIES.includes(
    attrs.fontFamily as (typeof FONT_FAMILIES)[number],
  )
    ? String(attrs.fontFamily)
    : "inherit";
  return (
    '<span style="position:absolute;white-space:pre;left:' +
    left +
    "pt;top:" +
    top +
    "pt;font-family:" +
    escapeHtml(family) +
    ";font-size:" +
    fontSize +
    "pt;color:" +
    color +
    (attrs.centered === true ? ";transform:translateX(-50%)" : "") +
    (attrs.bold === true ? ";font-weight:700" : "") +
    (attrs.italic === true ? ";font-style:italic" : "") +
    (attrs.underline === true
      ? ";text-decoration:underline;text-underline-offset:0.12em"
      : "") +
    '">' +
    inner +
    "</span>"
  );
}

function printText(value: string | undefined): string {
  return escapeHtml(value).replace(
    /[☐☒☑]/g,
    (glyph) =>
      '<svg aria-label="' +
      glyph +
      '" viewBox="0 0 12 12" width="0.8em" height="0.8em" style="display:inline-block;vertical-align:baseline"><rect x="0.5" y="0.5" width="11" height="11" fill="none" stroke="currentColor"/>' +
      (glyph === "☐"
        ? ""
        : '<path d="M2 2L10 10M10 2L2 10" fill="none" stroke="currentColor"/>') +
      "</svg>",
  );
}

export function renderNode(
  node: DocumentNode,
  values: Record<string, string>,
): string {
  const style = nodeStyle(node);
  const styled = style ? ' style="' + escapeHtml(style) + '"' : "";
  if (node.type === "text") {
    let text = printText(node.text);
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = "<strong>" + text + "</strong>";
      if (mark.type === "italic") text = "<em>" + text + "</em>";
      if (mark.type === "underline")
        text =
          mark.attrs?.variant === "double"
            ? '<u style="text-decoration-style:double;text-underline-offset:0.12em">' +
              text +
              "</u>"
            : '<u style="text-underline-offset:0.12em">' + text + "</u>";
      if (mark.type === "strike") text = "<s>" + text + "</s>";
      if (mark.type === "textStyle")
        text =
          '<span style="' +
          escapeHtml(nodeStyle({ type: "text", attrs: mark.attrs })) +
          '">' +
          text +
          "</span>";
    }
    return text;
  }
  if (node.type === "documentField") {
    const key = String(node.attrs?.key);
    if (node.attrs?.fieldType === "checkbox" && node.attrs.checkboxGlyph) {
      const glyph = String(node.attrs.checkboxGlyph);
      const symbol =
        (values[key] ?? node.attrs.checkboxValue) === "true"
          ? glyph === "□"
            ? "×"
            : glyph === "☑"
              ? "☑"
              : "☒"
          : glyph === "□"
            ? "□"
            : "☐";
      return (
        '<span style="position:relative;display:inline-block">' +
        '<span style="visibility:' +
        (symbol !== glyph && glyph !== "□" ? "hidden" : "visible") +
        '">' +
        renderNode({ type: "text", text: glyph, marks: node.marks }, values) +
        "</span>" +
        (symbol !== glyph
          ? '<span style="position:absolute;inset:0;text-align:center">' +
            renderNode(
              { type: "text", text: symbol, marks: node.marks },
              values,
            ) +
            "</span>"
          : "") +
        "</span>"
      );
    }
    if (node.attrs?.fieldType === "checkbox")
      return (
        '<span class="pdf-checkbox">' +
        (values[key] === "true"
          ? '<svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6L5 9L10 2" fill="none" stroke="black" stroke-width="2"/></svg>'
          : "") +
        "</span>"
      );
    let value = values[key] ?? "";
    if (node.attrs?.fieldType === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value))
      value = value.split("-").reverse().join(".");
    return renderNode({ type: "text", text: value, marks: node.marks }, values);
  }
  if (node.type === "pageField")
    return (
      '<span class="' +
      (node.attrs?.kind === "pages" ? "totalPages" : "pageNumber") +
      '" style="' +
      escapeHtml(
        nodeStyle({
          type: "text",
          attrs: node.marks?.find((mark) => mark.type === "textStyle")?.attrs,
        }),
      ) +
      '" data-page-field="' +
      (node.attrs?.kind === "pages" ? "pages" : "page") +
      '">' +
      (node.attrs?.kind === "pages" ? "‹Seiten›" : "‹Seite›") +
      "</span>"
    );
  if (node.type === "hardBreak") return "<br>";
  if (node.type === "pageBreak") return '<div class="page-break"></div>';
  if (node.type === "lineGroup") {
    const height = Math.max(0, Math.min(2000, Number(node.attrs?.height) || 0));
    const marginTop = Math.max(
      0,
      Math.min(2000, Number(node.attrs?.marginTop) || 0),
    );
    const marginBottom = Math.max(
      0,
      Math.min(2000, Number(node.attrs?.marginBottom) || 0),
    );
    const lines = Array.isArray(node.attrs?.lines)
      ? node.attrs.lines
          .slice(0, 50)
          .map((raw) => {
            const line = raw as Record<string, unknown>;
            const left = Math.max(
              -2000,
              Math.min(2000, Number(line.left) || 0),
            );
            const top = Math.max(-2000, Math.min(2000, Number(line.top) || 0));
            const width = Math.max(0, Math.min(2000, Number(line.width) || 0));
            const thickness = Math.max(
              0.25,
              Math.min(10, Number(line.thickness) || 0.5),
            );
            const color = /^#[0-9a-f]{6}$/i.test(String(line.color))
              ? String(line.color)
              : "#000000";
            return (
              '<span style="position:absolute;left:' +
              left +
              "pt;top:" +
              top +
              "pt;width:" +
              width +
              "pt;border-top:" +
              thickness +
              "pt solid " +
              color +
              '"></span>'
            );
          })
          .join("")
      : "";
    const storedLabels = Array.isArray(node.attrs?.labels)
      ? node.attrs.labels.slice(0, 100)
      : [];
    const contentLabels = (node.content ?? [])
      .filter((child) => child.type === "lineLabel")
      .slice(0, 100);
    const labels = (
      contentLabels.length ? contentLabels : storedLabels.map(() => null)
    )
      .map((child, index) => {
        const stored = storedLabels[index] as
          | Record<string, unknown>
          | undefined;
        if (
          stored &&
          (!child || inlineText(child) === storedLabelText(stored))
        ) {
          return positionedLabelHtml(
            stored,
            Array.isArray(stored.runs)
              ? stored.runs
                  .slice(0, 500)
                  .map((raw) => {
                    const run = raw as {
                      text?: unknown;
                      props?: Record<string, unknown>;
                    };
                    return (
                      '<span style="' +
                      escapeHtml(lineLabelRunStyle(run.props ?? {})) +
                      '">' +
                      printText(String(run.text ?? "")) +
                      "</span>"
                    );
                  })
                  .join("")
              : printText(String(stored.text ?? "")),
          );
        }
        if (!child) return "";
        return positionedLabelHtml(
          child.attrs ?? {},
          (child.content ?? [])
            .map((part) => renderNode(part, values))
            .join(""),
        );
      })
      .join("");
    return (
      '<div class="document-line-group" style="position:relative;height:' +
      height +
      "pt;margin-top:" +
      marginTop +
      "pt;margin-bottom:" +
      marginBottom +
      'pt">' +
      lines +
      labels +
      "</div>"
    );
  }
  if (node.type === "image") {
    const src = String(node.attrs?.src ?? "");
    if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(src)) return "";
    const width = Number(node.attrs?.width);
    return (
      '<img src="' +
      src +
      '" alt="' +
      escapeHtml(node.attrs?.alt) +
      '"' +
      (width > 0 && width <= 2000 ? ' width="' + width + '"' : "") +
      ">"
    );
  }
  const inner = (node.content ?? [])
    .map((child) => renderNode(child, values))
    .join("");
  const tags: Record<string, string> = {
    paragraph: "p",
    bulletList: "ul",
    orderedList: "ol",
    listItem: "li",
    table: "table",
    tableRow: "tr",
    tableCell: "td",
    tableHeader: "th",
    blockquote: "blockquote",
  };
  if (node.type === "doc") return inner;
  const tag =
    node.type === "heading"
      ? "h" + Math.min(6, Math.max(1, Number(node.attrs?.level) || 1))
      : tags[node.type];
  if (!tag) return inner;
  const border =
    tag === "table" &&
    (node.attrs?.border === "box" || node.attrs?.border === "none")
      ? ' data-border="' + node.attrs.border + '"'
      : "";
  const span = ["td", "th"].includes(tag)
    ? ' colspan="' +
      (Number(node.attrs?.colspan) || 1) +
      '" rowspan="' +
      (Number(node.attrs?.rowspan) || 1) +
      '"'
    : "";
  return (
    "<" +
    tag +
    styled +
    border +
    span +
    (tag === "ol" &&
    Number.isInteger(Number(node.attrs?.start)) &&
    Number(node.attrs?.start) > 0 &&
    Number(node.attrs?.start) < 10000
      ? ' start="' + Number(node.attrs?.start) + '"'
      : "") +
    ">" +
    (inner || (tag === "p" ? "<br>" : "")) +
    "</" +
    tag +
    ">"
  );
}

export const DOCUMENT_CSS =
  "body{color:#111;background:white;font-synthesis:none}p{margin:0 0 8pt;white-space:pre-wrap;overflow-wrap:anywhere;orphans:2;widows:2}h1,h2,h3,h4,h5,h6{break-after:avoid;margin:0 0 8pt;font-weight:700}h1{font-size:20pt}h2{font-size:16pt}h3{font-size:14pt}h4{font-size:12pt}h5{font-size:11pt}h6{font-size:10pt}ul,ol{margin:0 0 8pt;padding-left:20pt}blockquote{margin:0 0 8pt;padding-left:12pt;border-left:2pt solid #aaa}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #aaa;padding:4pt;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}table[data-border=box]{border:0.75pt solid #000}table[data-border=box] td,table[data-border=box] th{border:none;padding:1pt 4pt}table[data-border=none],table[data-border=none] td,table[data-border=none] th{border:none;padding:0}img{max-width:100%;height:auto}.page-break{break-before:page}.document-line-group{break-inside:avoid}u{text-underline-offset:0.12em}.pdf-checkbox{display:inline-flex;align-items:center;justify-content:center;width:10pt;height:10pt;border:1px solid black;vertical-align:middle}";

export function validateFieldValues(
  document: StyledDocument,
  input: Record<string, unknown>,
  complete = true,
): Record<string, string> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Werte fehlen.");
  const fields = documentFields(document);
  const allowed = new Set(fields.map((f) => f.key));
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key) || typeof value !== "string" || value.length > 8000)
      throw new Error("Ungültiger Feldwert: " + key);
    result[key] = value.trim();
  }
  for (const field of fields) {
    if (field.fieldType !== "checkbox" && result[field.key] === undefined)
      result[field.key] = "";
    if (field.fieldType === "checkbox" && result[field.key] === undefined)
      result[field.key] = "false";
    if (
      field.fieldType === "checkbox" &&
      !["true", "false"].includes(result[field.key])
    )
      throw new Error("Ungültiges Kontrollkästchen.");
    if (field.fieldType === "date" && result[field.key]) {
      const value = result[field.key];
      const iso = /^\d{2}\.\d{2}\.\d{4}$/.test(value)
        ? value.split(".").reverse().join("-")
        : value;
      const date = new Date(iso + "T00:00:00Z");
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(iso) ||
        !Number.isFinite(date.getTime()) ||
        date.toISOString().slice(0, 10) !== iso
      )
        throw new Error("Ungültiges Datum: " + field.label);
    }
    if (complete && !fieldComplete(field, result[field.key]))
      throw new Error("Bitte füllen Sie das Feld aus: " + field.label);
  }
  return result;
}

export function requiredFonts(
  document: StyledDocument,
): { family: string; bold: boolean; italic: boolean }[] {
  const found = new Map<
    string,
    { family: string; bold: boolean; italic: boolean }
  >();
  const walk = (
    node: DocumentNode,
    inherited = document.page.fontFamily,
    bold = false,
    italic = false,
  ) => {
    const style = node.marks?.find((m) => m.type === "textStyle")?.attrs;
    const family = String(
      style?.fontFamily ?? node.attrs?.fontFamily ?? inherited,
    );
    bold =
      bold ||
      Boolean(node.marks?.some((m) => m.type === "bold")) ||
      node.type === "heading" ||
      node.type === "tableHeader";
    italic = italic || Boolean(node.marks?.some((m) => m.type === "italic"));
    if (node.type === "text" || node.type === "documentField")
      found.set(family + bold + italic, { family, bold, italic });
    node.content?.forEach((child) => walk(child, family, bold, italic));
  };
  [document.content, document.header, document.footer].forEach((n) => walk(n));
  return [...found.values()];
}
