import type { DocumentSegment } from './documentSegments';

export const DOCUMENT_MASTER_KINDS = [
  'employment_contract',
  'arbeitszeugnis',
] as const;

export type DocumentMasterKind = (typeof DOCUMENT_MASTER_KINDS)[number];

export type DocumentMasterListItem = {
  id: string;
  name: string;
  kind: DocumentMasterKind;
  updatedAt: string;
};

export type DocumentMasterDetail = DocumentMasterListItem & {
  text: string;
  segments: DocumentSegment[];
};

export const DOCUMENT_MASTER_KIND_LABELS: Record<DocumentMasterKind, string> =
  {
    employment_contract: 'Arbeitsvertrag',
    arbeitszeugnis: 'Arbeitszeugnis',
  };
