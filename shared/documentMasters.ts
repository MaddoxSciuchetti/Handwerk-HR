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

/** Every stored template opens in the word editor and can hold variable fields. */
export function documentKindUsesEditor(kind: string): kind is DocumentMasterKind {
  return isDocumentMasterKind(kind);
}
