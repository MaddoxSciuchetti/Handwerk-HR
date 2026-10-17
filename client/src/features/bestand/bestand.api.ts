import { apiJson } from '@/config/apiClient';

export type ClothingStockItem = {
  id: string;
  name: string;
  size: string;
  quantity: number;
};

export type ClothingStockInput = {
  name: string;
  size: string;
  quantity: number;
};

type StockListResponse = {
  success: boolean;
  data: ClothingStockItem[];
};

type StockItemResponse = {
  success: boolean;
  data: ClothingStockItem;
};

export function getClothingStock() {
  return apiJson
    .get<StockListResponse>('/clothing-stock')
    .then((response) => response.data);
}

export function createClothingStockItem(input: ClothingStockInput) {
  return apiJson
    .post<StockItemResponse>('/clothing-stock', input)
    .then((response) => response.data);
}

export function updateClothingStockQuantity(id: string, quantity: number) {
  return apiJson
    .patch<StockItemResponse>(`/clothing-stock/${id}`, { quantity })
    .then((response) => response.data);
}

export function deleteClothingStockItem(id: string) {
  return apiJson.delete<{ success: boolean }>(`/clothing-stock/${id}`);
}
