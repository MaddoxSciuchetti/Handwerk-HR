import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useDeleteDocumentMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentMaster(id),
    onSuccess: async (_result, id) => {
      queryClient.removeQueries({
        queryKey: [DOCUMENT_MASTERS_KEY, id],
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: [DOCUMENT_MASTERS_KEY],
        exact: true,
      });
      await queryClient.invalidateQueries({ queryKey: ['automation'] });
    },
  });
}
