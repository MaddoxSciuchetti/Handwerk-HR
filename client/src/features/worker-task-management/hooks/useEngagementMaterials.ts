import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteEngagementMaterial,
  getEngagementMaterials,
  updateEngagementMaterial,
  uploadEngagementMaterial,
} from '../api/engagementMaterials.api';
import { ENGAGEMENT_MATERIALS } from '../consts/query-key.consts';

export function useEngagementMaterials(
  workerId: string,
  engagementId: string | null
) {
  return useQuery({
    queryKey: [ENGAGEMENT_MATERIALS, workerId, engagementId],
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
  return useMutation({
    mutationFn: (values: {
      materialId: string;
      name: string;
      articleNumber: string;
      quantity: number;
      unitPrice: string;
    }) => {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ENGAGEMENT_MATERIALS, workerId, engagementId],
      });
    },
  });
}

export function useDeleteEngagementMaterial(
  workerId: string,
  engagementId: string | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (materialId: string) => {
      if (!engagementId) {
        throw new Error('Engagement fehlt.');
      }
      return deleteEngagementMaterial(workerId, engagementId, materialId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [ENGAGEMENT_MATERIALS, workerId, engagementId],
      });
    },
  });
}
