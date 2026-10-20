import { useMutation, useQueryClient } from '@tanstack/react-query';
import { duplicateDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useDuplicateDocumentMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateDocumentMaster(id),
    onSuccess: async (created) => {
      queryClient.setQueryData([DOCUMENT_MASTERS_KEY, created.id], created);
      await queryClient.invalidateQueries({
        queryKey: [DOCUMENT_MASTERS_KEY],
        exact: true,
      });
    },
  });
}
