import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useCreateDocumentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      kind: string;
      name: string;
      file: File;
    }) => createDocumentMaster(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
      queryClient.setQueryData([DOCUMENT_MASTERS_KEY, created.id], created);
    },
  });
}
