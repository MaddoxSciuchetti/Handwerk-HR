import { z } from "zod";
import { BAD_REQUEST } from "@/constants/http";
import AppError from "@/utils/AppError";
import { FONT_FAMILIES } from "../../../shared/documentRendering";
import {
  readStyledDocument,
  type DocumentNode,
  type StyledDocument,
} from "../../../shared/document";

const nodeTypes = [
  "doc",
  "paragraph",
  "heading",
  "text",
  "hardBreak",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "table",
  "tableRow",
  "tableCell",
  "tableHeader",
  "image",
  "pageBreak",
  "lineGroup",
  "lineLabel",
  "documentField",
  "pageField",
];
export function parseStyledDocument(value: unknown): StyledDocument {
  try {
    const encoded = JSON.stringify(value);
    if (encoded.length > 5_000_000)
      throw new Error("Das Dokument ist zu groß.");
    const body = z
      .object({
        version: z.literal(3),
        importWarnings: z.array(z.string().max(500)).max(100).optional(),
        content: z.object({ type: z.literal("doc") }).passthrough(),
        header: z.object({ type: z.literal("doc") }).passthrough(),
        footer: z.object({ type: z.literal("doc") }).passthrough(),
        page: z.object({
          width: z.number().min(50).max(500),
          height: z.number().min(50).max(700),
          marginTop: z.number().min(0).max(100),
          marginBottom: z.number().min(0).max(100),
          marginLeft: z.number().min(0).max(100),
          marginRight: z.number().min(0).max(100),
          fontFamily: z.enum(FONT_FAMILIES),
          fontSize: z.number().min(4).max(72),
        }),
      })
      .parse(value) as StyledDocument;
    if (
      body.page.marginLeft + body.page.marginRight >= body.page.width ||
      body.page.marginTop + body.page.marginBottom >= body.page.height
    )
      throw new Error("Die Seitenränder sind zu groß.");
    const fields = new Map<string, string>();
    let count = 0;
    const walk = (node: DocumentNode, depth = 0) => {
      if (++count > 30_000 || depth > 30 || !nodeTypes.includes(node.type))
        throw new Error("Ungültige Dokumentstruktur.");
      if (node.text !== undefined && typeof node.text !== "string")
        throw new Error("Ungültiger Text.");
      const validateStyle = (attrs: Record<string, unknown> | undefined) => {
        if (!attrs) return;
        if (
          attrs.fontFamily !== undefined &&
          attrs.fontFamily !== null &&
          !FONT_FAMILIES.includes(
            attrs.fontFamily as (typeof FONT_FAMILIES)[number],
          )
        )
          throw new Error("Nicht unterstützte Schriftart.");
        for (const key of [
          "fontSize",
          "marginTop",
          "marginBottom",
          "marginLeft",
          "marginRight",
          "textIndent",
          "lineHeight",
          "paddingLeft",
          "blankUnderlineWidth",
        ]) {
          const raw = attrs[key];
          if (
            raw !== undefined &&
            raw !== null &&
            (typeof raw !== "number" ||
              !Number.isFinite(raw) ||
              (key !== "textIndent" && raw < 0) ||
              (key === "textIndent" && raw < -200) ||
              raw > 200)
          )
            throw new Error("Ungültige Formatierung.");
        }
        if (
          attrs.color !== undefined &&
          attrs.color !== null &&
          !/^#[0-9a-f]{6}$/i.test(String(attrs.color))
        )
          throw new Error("Ungültige Farbe.");
        if (
          attrs.textAlign !== undefined &&
          attrs.textAlign !== null &&
          !["left", "center", "right", "justify"].includes(
            String(attrs.textAlign),
          )
        )
          throw new Error("Ungültige Ausrichtung.");
      };
      validateStyle(node.attrs);
      if (node.type === "documentField") {
        const parsed = z
          .object({
            key: z
              .string()
              .max(120)
              .regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/),
            label: z.string().trim().min(1).max(120),
            fieldType: z.enum(["text", "date", "checkbox"]).default("text"),
            required: z.boolean().optional(),
          })
          .parse(node.attrs);
        const field = {
          ...parsed,
          required: parsed.required ?? parsed.fieldType !== "checkbox",
        };
        const previous = fields.get(field.key);
        const signature = JSON.stringify({
          fieldType: field.fieldType,
          required: field.required,
        });
        if (previous && previous !== signature)
          throw new Error("Wiederholte Felder müssen identisch sein.");
        fields.set(field.key, signature);
        node.attrs = field;
      }
      if (
        node.type === "image" &&
        !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(
          String(node.attrs?.src),
        )
      )
        throw new Error("Bilder müssen als PNG/JPEG eingebettet sein.");
      if (node.type === "lineGroup") {
        const lines = node.attrs?.lines;
        if (!Array.isArray(lines) || lines.length > 50)
          throw new Error("Ungültige Liniengruppe.");
        for (const line of lines) {
          const value = line as Record<string, unknown>;
          if (
            !["left", "top", "width", "thickness"].every(
              (key) =>
                typeof value[key] === "number" &&
                Number.isFinite(value[key]) &&
                Math.abs(Number(value[key])) <= 2000,
            ) ||
            !/^#[0-9a-f]{6}$/i.test(String(value.color))
          )
            throw new Error("Ungültige Liniengruppe.");
        }
        const labels = node.attrs?.labels;
        if (
          labels !== undefined &&
          (!Array.isArray(labels) || labels.length > 100)
        )
          throw new Error("Ungültige Liniengruppe.");
        for (const label of Array.isArray(labels) ? labels : []) {
          const value = label as Record<string, unknown>;
          if (
            typeof value.text !== "string" ||
            value.text.length > 500 ||
            !["left", "top", "fontSize"].every(
              (key) =>
                typeof value[key] === "number" &&
                Number.isFinite(value[key]) &&
                Math.abs(Number(value[key])) <= 2000,
            ) ||
            !/^#[0-9a-f]{6}$/i.test(String(value.color))
          )
            throw new Error("Ungültige Liniengruppe.");
        }
      }
      if (node.marks && !Array.isArray(node.marks))
        throw new Error("Ungültige Formatierung.");
      for (const mark of node.marks ?? []) {
        if (
          !["bold", "italic", "underline", "strike", "textStyle"].includes(
            mark.type,
          )
        )
          throw new Error("Unbekannte Formatierung.");
        validateStyle(mark.attrs);
      }
      if (node.content && !Array.isArray(node.content))
        throw new Error("Ungültiger Inhalt.");
      node.content?.forEach((child) => walk(child, depth + 1));
    };
    [body.content, body.header, body.footer].forEach((node) => walk(node));
    return body;
  } catch (error) {
    throw new AppError(
      BAD_REQUEST,
      error instanceof Error ? error.message : "Ungültiges Dokument.",
    );
  }
}
export { readStyledDocument };
