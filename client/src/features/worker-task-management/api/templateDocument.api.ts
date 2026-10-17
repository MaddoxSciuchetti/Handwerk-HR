import API, { apiJson } from '@/config/apiClient';
import type { DocumentSegment } from '@/features/settings/documents/documentSegments';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import type { UnmatchedQuestionnaireAnswer } from './employmentContract.api';

export type TemplateDocumentLink = {
  id: string;
  engagementId: string;
  masterId: string;
  name: string;
  kind: string;
};

export type TemplateDocumentDraft = TemplateDocumentLink & {
  segments: DocumentSegment[];
  document: StyledDocument;
  values: Record<string, string>;
  unmatchedAnswers: UnmatchedQuestionnaireAnswer[];
  questionnaireAnswers?: UnmatchedQuestionnaireAnswer[];
  masterRevision: number;
  matchedMasterRevision: number | null;
  questionnaireCompleted: boolean;
};

type ListResponse = { success: boolean; data: TemplateDocumentLink[] };
type DraftResponse = { success: boolean; data: TemplateDocumentDraft };

function documentPath(workerId: string, engagementId: string, documentId = '') {
  const base = `worker/${workerId}/engagements/${engagementId}/template-documents`;
  return documentId ? `${base}/${documentId}` : base;
}

export function listTemplateDocuments(workerId: string, engagementId: string) {
  return API.get<ListResponse, ListResponse>(
    documentPath(workerId, engagementId)
  ).then((response) => response.data);
}

export function createTemplateDocument(
  workerId: string,
  engagementId: string,
  masterId: string
) {
  return API.post<{ masterId: string }, DraftResponse>(
    documentPath(workerId, engagementId),
    { masterId }
  ).then((response) => response.data);
}

export function getTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string
) {
  return API.get<DraftResponse, DraftResponse>(
    documentPath(workerId, engagementId, documentId)
  ).then((response) => response.data);
}

export function saveTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string,
  values: Record<string, string>
) {
  return API.put<{ values: Record<string, string> }, DraftResponse>(
    documentPath(workerId, engagementId, documentId),
    { values }
  ).then((response) => response.data);
}

export function syncTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string
) {
  return API.post<Record<string, never>, DraftResponse>(
    documentPath(workerId, engagementId, documentId) + '/sync',
    {}
  ).then((response) => response.data);
}

export function printTemplateDocument(
  workerId: string,
  engagementId: string,
  documentId: string,
  values: Record<string, string>
) {
  return apiJson.post<Blob, { values: Record<string, string> }>(
    documentPath(workerId, engagementId, documentId) + '/print',
    { values },
    { responseType: 'blob' }
  );
}
