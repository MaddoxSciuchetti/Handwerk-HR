import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clothingStockKey } from '@/features/bestand/useBestand';
import {
  createEngagementClothing,
  deleteEngagementClothing,
  getEngagementClothing,
  returnEngagementClothing,
  type CreateEngagementClothingInput,
} from '../api/engagementClothing.api';

export const engagementClothingKey = (
  workerId: string,
  engagementId: string | null
) => ['engagement-clothing', workerId, engagementId] as const;

export function useEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  return useQuery({
    queryKey: engagementClothingKey(workerId, engagementId),
    staleTime: 30_000,
    queryFn: () => getEngagementClothing(workerId, engagementId!),
    enabled: Boolean(engagementId),
  });
}

function useRefreshClothing(workerId: string, engagementId: string | null) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({
      queryKey: engagementClothingKey(workerId, engagementId),
    });
    void queryClient.invalidateQueries({ queryKey: clothingStockKey });
  };
}

export function useCreateEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const refresh = useRefreshClothing(workerId, engagementId);
  return useMutation({
    mutationFn: (input: CreateEngagementClothingInput) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return createEngagementClothing(workerId, engagementId, input);
    },
    onSuccess: refresh,
  });
}

export function useReturnEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const refresh = useRefreshClothing(workerId, engagementId);
  return useMutation({
    mutationFn: ({ clothingId, quantity }: { clothingId: string; quantity: number }) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return returnEngagementClothing(workerId, engagementId, clothingId, quantity);
    },
    onSuccess: refresh,
  });
}

export function useDeleteEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const refresh = useRefreshClothing(workerId, engagementId);
  return useMutation({
    mutationFn: (clothingId: string) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return deleteEngagementClothing(workerId, engagementId, clothingId);
    },
    onSuccess: refresh,
  });
}
