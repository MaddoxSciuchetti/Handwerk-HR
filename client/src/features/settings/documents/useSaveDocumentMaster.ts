import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useSaveDocumentMaster(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; text: string }) =>
      updateDocumentMaster(id, input),
    onSuccess: (saved) => {
      queryClient.setQueryData([DOCUMENT_MASTERS_KEY, id], saved);
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
    },
  });
}
