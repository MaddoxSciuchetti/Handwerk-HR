import type { DocumentSegment } from './documentSegments';
import type { StyledDocument } from './styledDocument';

export const DOCUMENT_MASTER_KINDS = [
  'employment_contract',
  'arbeitszeugnis',
] as const;

export type DocumentMasterKind = (typeof DOCUMENT_MASTER_KINDS)[number];

export type DocumentMasterListItem = {
  id: string;
  name: string;
  kind: DocumentMasterKind;
  isPrimary: boolean;
  updatedAt: string;
};

export type DocumentMasterDetail = DocumentMasterListItem & {
  text: string;
  segments: DocumentSegment[];
  document: StyledDocument;
  revision: number;
  approvedAt: string | null;
  sourceUrl?: string | null;
  sourceMime?: string | null;
  importWarnings?: string[];
};

export const DOCUMENT_MASTER_KIND_LABELS: Record<DocumentMasterKind, string> = {
  employment_contract: 'Arbeitsvertrag',
  arbeitszeugnis: 'Arbeitszeugnis',
};
