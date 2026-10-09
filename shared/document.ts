// Canonical document model shared by the editor, matching adapter and PDF renderer.
export type DocumentField = {
  key: string;
  label: string;
  fieldType?: "text" | "date" | "checkbox";
  required?: boolean;
};
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
      paragraphs
        .at(-1)!
        .content!.push({
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
    if (node.type === "documentField")
      result.push({ type: "input", ...(node.attrs as DocumentField) });
    node.content?.forEach(walk);
    if (["paragraph", "heading", "tableRow", "pageBreak"].includes(node.type))
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
  if (field.fieldType === "checkbox")
    return field.required
      ? value === "true"
      : value === "true" || value === "false";
  return !field.required || Boolean(value?.trim());
}

export function filledDocument(
  document: StyledDocument,
  values: Record<string, string>,
): StyledDocument {
  const fill = (node: DocumentNode): DocumentNode => {
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
