import API from '@/config/apiClient';
import type { DocumentSegment } from './documentSegments';
import type { StyledDocument } from './styledDocument';
import type {
  DocumentMasterDetail,
  DocumentMasterKind,
  DocumentMasterListItem,
} from './documentMaster.types';

export function listDocumentMasters(): Promise<DocumentMasterListItem[]> {
  return API.get<DocumentMasterListItem[], DocumentMasterListItem[]>(
    '/document-masters'
  );
}

export function getDocumentMaster(id: string): Promise<DocumentMasterDetail> {
  return API.get<DocumentMasterDetail, DocumentMasterDetail>(
    `/document-masters/${id}`
  );
}

export function createDocumentMaster(input: {
  kind: DocumentMasterKind;
  name: string;
  file: File;
}): Promise<DocumentMasterDetail> {
  const form = new FormData();
  form.append('kind', input.kind);
  form.append('name', input.name);
  form.append('file', input.file);
  return API.post<FormData, DocumentMasterDetail>('/document-masters', form);
}

export function setPrimaryDocumentMaster(
  id: string
): Promise<DocumentMasterDetail> {
  return API.post<undefined, DocumentMasterDetail>(
    `/document-masters/${id}/primary`
  );
}

export function deleteDocumentMaster(id: string): Promise<void> {
  return API.delete(`/document-masters/${id}`);
}

export function updateDocumentMaster(
  id: string,
  input: {
    name: string;
    text?: string;
    segments?: DocumentSegment[];
    document?: StyledDocument;
    revision?: number;
    approved?: boolean;
  }
): Promise<DocumentMasterDetail> {
  return API.put<typeof input, DocumentMasterDetail>(
    `/document-masters/${id}`,
    input
  );
}
