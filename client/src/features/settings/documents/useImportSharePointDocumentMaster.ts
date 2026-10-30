import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importSharePointDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';

export function useImportSharePointDocumentMaster() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      kind: string;
      name: string;
      driveId: string;
      itemId: string;
    }) => importSharePointDocumentMaster(input),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
      queryClient.setQueryData([DOCUMENT_MASTERS_KEY, created.id], created);
    },
  });
}
