import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setPrimaryDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';
import type {
  DocumentMasterDetail,
  DocumentMasterListItem,
} from './documentMaster.types';

function withPrimaryMaster<T>(previous: T, id: string): T {
  if (Array.isArray(previous)) {
    return previous.map((item: DocumentMasterListItem) =>
      item.kind === 'employment_contract'
        ? { ...item, isPrimary: item.id === id }
        : item
    ) as T;
  }
  if (
    previous &&
    typeof previous === 'object' &&
    'kind' in previous &&
    previous.kind === 'employment_contract'
  ) {
    const detail = previous as unknown as DocumentMasterDetail;
    return { ...detail, isPrimary: detail.id === id } as T;
  }
  return previous;
}

export function useSetPrimaryDocumentMaster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => setPrimaryDocumentMaster(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
      const previous = queryClient.getQueriesData({
        queryKey: [DOCUMENT_MASTERS_KEY],
      });
      queryClient.setQueriesData(
        { queryKey: [DOCUMENT_MASTERS_KEY] },
        (current) => withPrimaryMaster(current, id)
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
