import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDocumentMaster } from './documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from './documentMaster.keys';
import type { DocumentSegment } from './documentSegments';
import type { StyledDocument } from './styledDocument';
import type { DocumentMasterDetail } from './documentMaster.types';

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
      queryClient.setQueryData<DocumentMasterDetail>(
        [DOCUMENT_MASTERS_KEY, id],
        (previous) => {
          // Saving does not change the original upload or sign another URL.
          return {
            ...previous,
            ...saved,
            sourceUrl: saved.sourceUrl ?? previous?.sourceUrl,
          };
        }
      );
      // The saved detail is already authoritative. Refresh only the list, not
      // this active editor (which used to flash/reload after each save).
      queryClient.invalidateQueries({
        queryKey: [DOCUMENT_MASTERS_KEY],
        exact: true,
      });
      // Drafts follow the master in the database. Refresh them on their next
      // mount rather than leaving the previous master in the client cache.
      // Do not replace local values in any currently open child editor.
      void queryClient.invalidateQueries({
        predicate: ({ queryKey, state }) => {
          if (
            !['employment-contract', 'template-document'].includes(
              String(queryKey[0])
            )
          )
            return false;
          const draft = state.data as
            | { masterId?: string; sentAt?: string | null; status?: string }
            | undefined;
          return (
            draft?.masterId === id && !draft.sentAt && draft.status !== 'signed'
          );
        },
        refetchType: 'none',
      });
    },
  });
}
