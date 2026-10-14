import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';
import type { DocumentMasterListItem } from './documentMaster.types';

export function useDeleteDocumentMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocumentMaster(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
      const previous = queryClient.getQueriesData({
        queryKey: [DOCUMENT_MASTERS_KEY],
      });
      queryClient.setQueriesData(
        { queryKey: [DOCUMENT_MASTERS_KEY] },
        (current) =>
          Array.isArray(current)
            ? current.filter((item: DocumentMasterListItem) => item.id !== id)
            : current
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      for (const [key, data] of context?.previous ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: [DOCUMENT_MASTERS_KEY],
        exact: true,
      });
    },
  });
}
