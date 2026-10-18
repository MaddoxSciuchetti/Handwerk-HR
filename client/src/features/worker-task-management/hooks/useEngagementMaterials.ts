import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  deleteEngagementMaterial,
  getEngagementMaterials,
  updateEngagementMaterial,
  uploadEngagementMaterial,
  type EngagementMaterialItem,
  type EngagementMaterials,
} from '../api/engagementMaterials.api';
import { ENGAGEMENT_MATERIALS } from '../consts/query-key.consts';

type MaterialSnapshot = {
  previous?: EngagementMaterials;
};

function mapMaterials(
  data: EngagementMaterials,
  mapItem: (item: EngagementMaterialItem) => EngagementMaterialItem | null
): EngagementMaterials {
  const apply = (items: EngagementMaterialItem[]) =>
    items.flatMap((item) => {
      const next = mapItem(item);
      return next ? [next] : [];
    });

  return {
    documents: data.documents.map((document) => ({
      ...document,
      materials: apply(document.materials),
    })),
    unassigned: apply(data.unassigned),
  };
}

export function useEngagementMaterials(
  workerId: string,
  engagementId: string | null
) {
  return useQuery({
    queryKey: [ENGAGEMENT_MATERIALS, workerId, engagementId],
    staleTime: 30_000,
    queryFn: () => getEngagementMaterials(workerId, engagementId!),
    enabled: Boolean(engagementId),
  });
}

export function useUploadEngagementMaterial(
  workerId: string,
  engagementId: string | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      if (!engagementId) {
        throw new Error('Engagement fehlt.');
      }
      return uploadEngagementMaterial(workerId, engagementId, file);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ENGAGEMENT_MATERIALS, workerId, engagementId],
      });
    },
  });
}

export function useUpdateEngagementMaterial(
  workerId: string,
  engagementId: string | null
) {
  const queryClient = useQueryClient();
  const queryKey = [ENGAGEMENT_MATERIALS, workerId, engagementId] as const;

  return useMutation<
    EngagementMaterialItem,
    Error,
    {
      materialId: string;
      name: string;
      articleNumber: string;
      quantity: number;
      unitPrice: string;
    },
    MaterialSnapshot
  >({
    mutationFn: (values) => {
      if (!engagementId) {
        throw new Error('Engagement fehlt.');
      }
      const { materialId, ...rest } = values;
      return updateEngagementMaterial(
        workerId,
        engagementId,
        materialId,
        rest
      );
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EngagementMaterials>(queryKey);
      if (previous) {
        queryClient.setQueryData<EngagementMaterials>(
          queryKey,
          mapMaterials(previous, (item) =>
            item.id === values.materialId ? { ...item, ...values } : item
          )
        );
      }
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Material konnte nicht gespeichert werden.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteEngagementMaterial(
  workerId: string,
  engagementId: string | null
) {
  const queryClient = useQueryClient();
  const queryKey = [ENGAGEMENT_MATERIALS, workerId, engagementId] as const;

  return useMutation<void, Error, string, MaterialSnapshot>({
    mutationFn: (materialId) => {
      if (!engagementId) {
        throw new Error('Engagement fehlt.');
      }
      return deleteEngagementMaterial(workerId, engagementId, materialId);
    },
    onMutate: async (materialId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<EngagementMaterials>(queryKey);
      if (previous) {
        queryClient.setQueryData<EngagementMaterials>(
          queryKey,
          mapMaterials(previous, (item) =>
            item.id === materialId ? null : item
          )
        );
      }
      return { previous };
    },
    onError: (_error, _materialId, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error('Material konnte nicht gelöscht werden.');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
