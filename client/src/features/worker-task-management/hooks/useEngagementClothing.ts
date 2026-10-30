import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clothingStockKey } from '@/features/bestand/useBestand';
import {
  createEngagementClothing,
  deleteEngagementClothing,
  getEngagementClothing,
  returnEngagementClothing,
  type CreateEngagementClothingInput,
  type EngagementClothingItem,
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

function useClothingCache(workerId: string, engagementId: string | null) {
  const queryClient = useQueryClient();
  const key = engagementClothingKey(workerId, engagementId);

  return {
    async write(
      updater: (
        current: EngagementClothingItem[] | undefined
      ) => EngagementClothingItem[]
    ) {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData<EngagementClothingItem[]>(key, updater);
      void queryClient.invalidateQueries({ queryKey: clothingStockKey });
      void queryClient.invalidateQueries({ queryKey: key });
    },
  };
}

export function useCreateEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const cache = useClothingCache(workerId, engagementId);
  return useMutation({
    mutationFn: (input: CreateEngagementClothingInput) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return createEngagementClothing(workerId, engagementId, input);
    },
    onSuccess: async (created) => {
      await cache.write((current) =>
        current?.some((item) => item.id === created.id)
          ? current.map((item) => (item.id === created.id ? created : item))
          : [...(current ?? []), created]
      );
    },
  });
}

export function useReturnEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const cache = useClothingCache(workerId, engagementId);
  return useMutation({
    mutationFn: ({
      clothingId,
      quantity,
    }: {
      clothingId: string;
      quantity: number;
    }) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return returnEngagementClothing(
        workerId,
        engagementId,
        clothingId,
        quantity
      );
    },
    onSuccess: async (updated) => {
      await cache.write((current) =>
        (current ?? []).map((item) =>
          item.id === updated.id ? updated : item
        )
      );
    },
  });
}

export function useDeleteEngagementClothing(
  workerId: string,
  engagementId: string | null
) {
  const cache = useClothingCache(workerId, engagementId);
  return useMutation({
    mutationFn: (clothingId: string) => {
      if (!engagementId) throw new Error('Engagement fehlt.');
      return deleteEngagementClothing(workerId, engagementId, clothingId);
    },
    onSuccess: async (_result, clothingId) => {
      await cache.write((current) =>
        (current ?? []).filter((item) => item.id !== clothingId)
      );
    },
  });
}
