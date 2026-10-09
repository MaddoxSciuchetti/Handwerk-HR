import { apiJson } from '@/config/apiClient';

export type EngagementMaterialItem = {
  id: string;
  name: string;
  articleNumber: string;
  quantity: number;
  unitPrice: string;
  sourceDocumentId: string | null;
};

export type EngagementMaterialDocument = {
  id: string;
  name: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
  presignedUrl: string;
  materials: EngagementMaterialItem[];
};

export type EngagementMaterials = {
  documents: EngagementMaterialDocument[];
  unassigned: EngagementMaterialItem[];
};

type MaterialsResponse = {
  success: boolean;
  data: EngagementMaterials;
};

type MaterialResponse = {
  success: boolean;
  data: EngagementMaterialItem;
};

type UploadResponse = {
  success: boolean;
  data: { document: EngagementMaterialDocument };
};

function materialsPath(workerId: string, engagementId: string) {
  return `worker/${workerId}/engagements/${engagementId}/materials`;
}

export function getEngagementMaterials(
  workerId: string,
  engagementId: string
): Promise<EngagementMaterials> {
  return apiJson
    .get<MaterialsResponse>(materialsPath(workerId, engagementId))
    .then((response) => response.data);
}

export function uploadEngagementMaterial(
  workerId: string,
  engagementId: string,
  file: File
): Promise<EngagementMaterialDocument> {
  const body = new FormData();
  body.append('file', file);
  return apiJson
    .post<UploadResponse>(materialsPath(workerId, engagementId), body)
    .then((response) => response.data.document);
}

export function updateEngagementMaterial(
  workerId: string,
  engagementId: string,
  materialId: string,
  values: {
    name: string;
    articleNumber: string;
    quantity: number;
    unitPrice: string;
  }
): Promise<EngagementMaterialItem> {
  return apiJson
    .patch<MaterialResponse>(
      `${materialsPath(workerId, engagementId)}/${materialId}`,
      values
    )
    .then((response) => response.data);
}

export function deleteEngagementMaterial(
  workerId: string,
  engagementId: string,
  materialId: string
): Promise<void> {
  return apiJson.delete(
    `${materialsPath(workerId, engagementId)}/${materialId}`
  );
}
