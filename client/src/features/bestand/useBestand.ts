import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createClothingStockItem,
  deleteClothingStockItem,
  getClothingStock,
  updateClothingStockQuantity,
  type ClothingStockInput,
} from './bestand.api';

export const clothingStockKey = ['clothing-stock'] as const;

export function useClothingStock(enabled = true) {
  return useQuery({
    queryKey: clothingStockKey,
    queryFn: getClothingStock,
    enabled,
  });
}

function useRefreshStock() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: clothingStockKey });
  };
}

export function useCreateClothingStockItem() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: (input: ClothingStockInput) => createClothingStockItem(input),
    onSuccess: refresh,
  });
}

export function useUpdateClothingStockQuantity() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      updateClothingStockQuantity(id, quantity),
    onSuccess: refresh,
  });
}

export function useDeleteClothingStockItem() {
  const refresh = useRefreshStock();
  return useMutation({
    mutationFn: (id: string) => deleteClothingStockItem(id),
    onSuccess: refresh,
  });
}
