export const DOCUMENT_MASTER_KINDS = [
  "employment_contract",
  "arbeitszeugnis",
  "verschwiegenheitsvereinbarung",
  "dienstanweisung",
  "kfz_ueberlassungsvertrag",
] as const;

export type DocumentMasterKind = (typeof DOCUMENT_MASTER_KINDS)[number];

export const DOCUMENT_MASTER_KIND_LABELS: Record<DocumentMasterKind, string> = {
  employment_contract: "Arbeitsvertrag",
  arbeitszeugnis: "Arbeitszeugnis",
  verschwiegenheitsvereinbarung: "Verschwiegenheitsvereinbarung",
  dienstanweisung: "Dienstanweisung",
  kfz_ueberlassungsvertrag: "KFZ-Überlassungsvertrag",
};

export function isDocumentMasterKind(kind: string): kind is DocumentMasterKind {
  return (DOCUMENT_MASTER_KINDS as readonly string[]).includes(kind);
}

export const TEMPLATE_DOCUMENT_KINDS = DOCUMENT_MASTER_KINDS.filter(
  (kind) => kind !== "employment_contract",
);

export function normalizeDocumentKind(value: string): string | null {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0 || trimmed.length > 80) return null;
  const known = DOCUMENT_MASTER_KINDS.find(
    (kind) =>
      kind === trimmed ||
      DOCUMENT_MASTER_KIND_LABELS[kind].toLocaleLowerCase("de") ===
        trimmed.toLocaleLowerCase("de"),
  );
  return known ?? trimmed;
}

export function documentKindLabel(kind: string): string {
  return isDocumentMasterKind(kind) ? DOCUMENT_MASTER_KIND_LABELS[kind] : kind;
}

export function isTemplateDocumentKind(kind: string): boolean {
  const normalized = normalizeDocumentKind(kind);
  return normalized !== null && normalized !== "employment_contract";
}

/** Every stored template opens in the word editor and can hold variable fields. */
export function documentKindUsesEditor(kind: string): boolean {
  return normalizeDocumentKind(kind) !== null;
}
