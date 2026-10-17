import { apiJson } from '@/config/apiClient';
import type { PersonnelDocumentName } from '../personnel-documents/personnelDocumentNames';

export type PersonnelDocument = {
  id: string;
  engagementId: string;
  folderId: string | null;
  name: PersonnelDocumentName | 'ordner';
  label: string;
  originalFileName: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
  presignedUrl: string;
};

export type PersonnelFolder = {
  id: string;
  engagementId: string;
  label: string;
};

export type PersonnelLibrary = {
  documents: PersonnelDocument[];
  folders: PersonnelFolder[];
};

type ListResponse = {
  success: boolean;
  data: PersonnelDocument[];
  folders?: PersonnelFolder[];
};

type UploadResponse = {
  success: boolean;
  data: PersonnelDocument;
};

export function getPersonnelDocuments(
  workerId: string
): Promise<PersonnelLibrary> {
  return apiJson
    .get<ListResponse>(`worker/${workerId}/personnel-documents`)
    .then((response) => ({
      documents: response.data,
      folders: response.folders ?? [],
    }));
}

export function createPersonnelFolder(
  workerId: string,
  engagementId: string,
  label: string
): Promise<PersonnelFolder> {
  return apiJson
    .post<{ success: boolean; data: PersonnelFolder }>(
      `worker/${workerId}/engagements/${engagementId}/personnel-folders`,
      { label }
    )
    .then((response) => response.data);
}

export function uploadPersonnelDocument(
  workerId: string,
  engagementId: string,
  input: { name: string; folderId?: string; file: File }
): Promise<PersonnelDocument> {
  const body = new FormData();
  body.append('name', input.name);
  if (input.folderId) body.append('folderId', input.folderId);
  body.append('file', input.file);
  return apiJson
    .post<UploadResponse>(
      `worker/${workerId}/engagements/${engagementId}/personnel-documents`,
      body
    )
    .then((response) => response.data);
}

export function renamePersonnelDocument(
  workerId: string,
  documentId: string,
  name: string
): Promise<{ success: boolean; data: { name: string } }> {
  return apiJson.patch<{ success: boolean; data: { name: string } }>(
    `worker/${workerId}/personnel-documents/${documentId}`,
    { name }
  );
}

export function deletePersonnelDocument(
  workerId: string,
  documentId: string
): Promise<{ success: boolean }> {
  return apiJson.delete<{ success: boolean }>(
    `worker/${workerId}/personnel-documents/${documentId}`
  );
}
