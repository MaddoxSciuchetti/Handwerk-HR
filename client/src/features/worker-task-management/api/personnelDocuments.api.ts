import { apiJson } from '@/config/apiClient';
import type { PersonnelDocumentName } from '../personnel-documents/personnelDocumentNames';

export type PersonnelDocument = {
  id: string;
  engagementId: string;
  name: PersonnelDocumentName;
  label: string;
  originalFileName: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
  presignedUrl: string;
};

type ListResponse = {
  success: boolean;
  data: PersonnelDocument[];
};

type UploadResponse = {
  success: boolean;
  data: PersonnelDocument;
};

export function getPersonnelDocuments(
  workerId: string
): Promise<PersonnelDocument[]> {
  return apiJson
    .get<ListResponse>(`worker/${workerId}/personnel-documents`)
    .then((response) => response.data);
}

export function uploadPersonnelDocument(
  workerId: string,
  engagementId: string,
  name: PersonnelDocumentName,
  file: File
): Promise<PersonnelDocument> {
  const body = new FormData();
  body.append('name', name);
  body.append('file', file);
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
