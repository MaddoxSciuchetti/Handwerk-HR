// Canonical document model shared by the editor, matching adapter and PDF renderer.
export type DocumentField = {
  key: string;
  label: string;
  fieldType?: "text" | "date" | "checkbox" | "points";
  required?: boolean;
  dateMode?: "today" | null;
};

/** Keep checkbox storage independent of the questionnaire's display language. */
export function normalizeDocumentFieldValue(
  fieldType: string | undefined,
  value: string,
): string {
  if (fieldType !== "checkbox") return value;
  switch (value.trim().toLowerCase()) {
    case "ja":
    case "true":
      return "true";
    case "nein":
    case "false":
      return "false";
    default:
      return value;
  }
}

/** Resolve business dates consistently in the app's German time zone. */
export function currentDocumentDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isCurrentDateField(
  field: Pick<DocumentField, "fieldType" | "dateMode">,
) {
  return field.fieldType === "date" && field.dateMode === "today";
}

export function resolveCurrentDateValues(
  document: StyledDocument,
  values: Record<string, string>,
  now = new Date(),
): Record<string, string> {
  const result = { ...values };
  const today = currentDocumentDate(now);
  for (const field of documentFields(document))
    if (isCurrentDateField(field)) result[field.key] = today;
  return result;
}

export function descriptionPointLines(value: string | undefined) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
export type DocumentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: DocumentNode[];
};
export type StyledDocument = {
  version: 3;
  content: DocumentNode;
  header: DocumentNode;
  footer: DocumentNode;
  page: {
    width: number;
    height: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    fontFamily: string;
    fontSize: number;
  };
  importWarnings?: string[];
};
export type LegacySegment =
  | { type: "text"; text: string }
  | ({ type: "input" } & DocumentField);

export const DEFAULT_PAGE: StyledDocument["page"] = {
  width: 210,
  height: 297,
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
  fontFamily: "Calibri",
  fontSize: 11,
};
export const emptyContent = (): DocumentNode => ({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export function fromSegments(segments: LegacySegment[]): StyledDocument {
  const paragraphs: DocumentNode[] = [{ type: "paragraph", content: [] }];
  for (const segment of segments) {
    if (segment.type === "input") {
      paragraphs.at(-1)!.content!.push({
        type: "documentField",
        attrs: {
          ...segment,
          fieldType: segment.fieldType ?? "text",
          required: segment.required ?? segment.fieldType !== "checkbox",
        },
      });
    } else {
      const lines = segment.text.split("\n");
      lines.forEach((line, i) => {
        if (i) paragraphs.push({ type: "paragraph", content: [] });
        if (line)
          paragraphs.at(-1)!.content!.push({ type: "text", text: line });
      });
    }
  }
  return {
    version: 3,
    content: { type: "doc", content: paragraphs },
    header: emptyContent(),
    footer: emptyContent(),
    page: { ...DEFAULT_PAGE },
  };
}

export function readStyledDocument(body: unknown): StyledDocument {
  const value = body as
    | (Partial<StyledDocument> & { segments?: LegacySegment[]; text?: string })
    | null;
  if (value?.version === 3 && value.content && value.page)
    return value as StyledDocument;
  return fromSegments(
    value?.segments ?? [{ type: "text", text: value?.text ?? "" }],
  );
}

export function documentSegments(document: StyledDocument): LegacySegment[] {
  const result: LegacySegment[] = [];
  const walk = (node: DocumentNode) => {
    if (node.type === "text")
      result.push({ type: "text", text: node.text ?? "" });
    if (node.type === "hardBreak") result.push({ type: "text", text: "\n" });
    if (node.type === "documentField" || node.type === "descriptionPoints")
      result.push({ type: "input", ...(node.attrs as DocumentField) });
    if (node.type === "lineGroup" && Array.isArray(node.attrs?.labels))
      for (const label of node.attrs.labels)
        if (typeof (label as Record<string, unknown>).text === "string")
          result.push({
            type: "text",
            text: String((label as Record<string, unknown>).text),
          });
    node.content?.forEach(walk);
    if (
      ["paragraph", "heading", "tableRow", "pageBreak", "lineGroup"].includes(
        node.type,
      )
    )
      result.push({ type: "text", text: "\n" });
  };
  [document.header, document.content, document.footer].forEach(walk);
  return result;
}

export function documentFields(document: StyledDocument): DocumentField[] {
  const fields = new Map<string, DocumentField>();
  for (const segment of documentSegments(document))
    if (segment.type === "input") fields.set(segment.key, segment);
  return [...fields.values()];
}

export function fieldComplete(
  field: DocumentField,
  value: string | undefined,
): boolean {
  if (isCurrentDateField(field)) return true;
  if (field.fieldType === "checkbox")
    return field.required
      ? value === "true"
      : value === "true" || value === "false";
  if (field.fieldType === "points")
    return !field.required || descriptionPointLines(value).length > 0;
  return !field.required || Boolean(value?.trim());
}

export function filledDocument(
  document: StyledDocument,
  values: Record<string, string>,
): StyledDocument {
  const fill = (node: DocumentNode): DocumentNode => {
    if (node.type === "descriptionPoints") {
      const lines = descriptionPointLines(values[String(node.attrs?.key)]);
      if (lines.length === 0) return { type: "paragraph" };
      return {
        type: "bulletList",
        content: lines.map((text) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })),
      };
    }
    if (
      node.type === "documentField" &&
      node.attrs?.fieldType === "checkbox" &&
      node.attrs.checkboxGlyph
    )
      return {
        ...node,
        attrs: {
          ...node.attrs,
          checkboxValue:
            values[String(node.attrs.key)] === "true" ? "true" : "false",
        },
      };
    if (node.type === "documentField")
      return {
        type: "text",
        marks: node.marks,
        text:
          node.attrs?.fieldType === "checkbox"
            ? values[String(node.attrs.key)] === "true"
              ? "☑"
              : "☐"
            : (values[String(node.attrs?.key)] ?? ""),
      };
    return {
      ...node,
      ...(node.content ? { content: node.content.map(fill) } : {}),
    };
  };
  return {
    ...document,
    content: fill(document.content),
    header: fill(document.header),
    footer: fill(document.footer),
  };
}
