import type { ClothingPrintType } from '@shared/clothing';
import { apiJson } from '@/config/apiClient';

export type ClothingSource = 'storage' | 'purchased';

export type EngagementClothingItem = {
  id: string;
  name: string;
  size: string;
  printType: ClothingPrintType;
  productUrl: string | null;
  source: ClothingSource;
  quantity: number;
  returnedQuantity: number;
  stockItemId: string | null;
  issuedAt: string;
};

export type CreateEngagementClothingInput = {
  stockItemId?: string;
  name?: string;
  size?: string;
  printType?: ClothingPrintType;
  productUrl?: string;
  quantity: number;
  issuedAt?: string;
};

type ClothingListResponse = {
  success: boolean;
  data: EngagementClothingItem[];
};

type ClothingItemResponse = {
  success: boolean;
  data: EngagementClothingItem;
};

function clothingPath(workerId: string, engagementId: string) {
  return `worker/${workerId}/engagements/${engagementId}/clothing`;
}

export function getEngagementClothing(workerId: string, engagementId: string) {
  return apiJson
    .get<ClothingListResponse>(clothingPath(workerId, engagementId))
    .then((response) => response.data);
}

export function createEngagementClothing(
  workerId: string,
  engagementId: string,
  input: CreateEngagementClothingInput
) {
  return apiJson
    .post<ClothingItemResponse>(clothingPath(workerId, engagementId), input)
    .then((response) => response.data);
}

export function returnEngagementClothing(
  workerId: string,
  engagementId: string,
  clothingId: string,
  quantity: number
) {
  return apiJson
    .post<ClothingItemResponse>(
      `${clothingPath(workerId, engagementId)}/${clothingId}/return`,
      { quantity }
    )
    .then((response) => response.data);
}

export function deleteEngagementClothing(
  workerId: string,
  engagementId: string,
  clothingId: string
) {
  return apiJson.delete<{ success: boolean }>(
    `${clothingPath(workerId, engagementId)}/${clothingId}`
  );
}
