import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';
import type { DocumentSegment } from './documentSegments';
import type { StyledDocument } from './styledDocument';

export function useSaveDocumentMaster(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      text?: string;
      segments?: DocumentSegment[];
      document?: StyledDocument;
      revision?: number;
      approved?: boolean;
    }) => updateDocumentMaster(id, input),
    onSuccess: (saved) => {
      queryClient.setQueryData([DOCUMENT_MASTERS_KEY, id], saved);
      queryClient.invalidateQueries({ queryKey: [DOCUMENT_MASTERS_KEY] });
    },
  });
}
