import type { DocumentMasterKind } from '@shared/documentMasters';
import type { DocumentSegment } from './documentSegments';
import type { StyledDocument } from './styledDocument';

export type { DocumentMasterKind };
export {
  DOCUMENT_MASTER_KIND_LABELS,
  DOCUMENT_MASTER_KINDS,
  TEMPLATE_DOCUMENT_KINDS,
  documentKindLabel,
  documentKindUsesEditor,
  isDocumentMasterKind,
  isTemplateDocumentKind,
  normalizeDocumentKind,
} from '@shared/documentMasters';

export type DocumentMasterListItem = {
  id: string;
  name: string;
  kind: string;
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
