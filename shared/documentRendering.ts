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
    "lineHeight",
    "paddingLeft",
  ]) {
    const n = Number(a[key]);
    if (
      a[key] !== undefined &&
      a[key] !== null &&
      Number.isFinite(n) &&
      n >= 0 &&
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
  return rules.join(";");
}

export function renderNode(
  node: DocumentNode,
  values: Record<string, string>,
): string {
  const style = nodeStyle(node);
  const styled = style ? ' style="' + escapeHtml(style) + '"' : "";
  if (node.type === "text") {
    let text = escapeHtml(node.text);
    for (const mark of node.marks ?? []) {
      if (mark.type === "bold") text = "<strong>" + text + "</strong>";
      if (mark.type === "italic") text = "<em>" + text + "</em>";
      if (mark.type === "underline") text = "<u>" + text + "</u>";
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
  if (node.type === "hardBreak") return "<br>";
  if (node.type === "pageBreak") return '<div class="page-break"></div>';
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
    span +
    ">" +
    (inner || (tag === "p" ? "<br>" : "")) +
    "</" +
    tag +
    ">"
  );
}

export const DOCUMENT_CSS =
  "body{color:#111;background:white;font-synthesis:none}p{margin:0 0 8pt;white-space:pre-wrap;overflow-wrap:anywhere;orphans:2;widows:2}h1,h2,h3,h4,h5,h6{break-after:avoid;margin:0 0 8pt;font-weight:700}h1{font-size:20pt}h2{font-size:16pt}h3{font-size:14pt}h4{font-size:12pt}h5{font-size:11pt}h6{font-size:10pt}ul,ol{margin:0 0 8pt;padding-left:20pt}blockquote{margin:0 0 8pt;padding-left:12pt;border-left:2pt solid #aaa}table{border-collapse:collapse;width:100%;table-layout:fixed}td,th{border:1px solid #aaa;padding:4pt;vertical-align:top;overflow-wrap:anywhere}tr{break-inside:avoid}img{max-width:100%;height:auto}.page-break{break-before:page}.pdf-checkbox{display:inline-flex;align-items:center;justify-content:center;width:10pt;height:10pt;border:1px solid black;vertical-align:middle}";

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
