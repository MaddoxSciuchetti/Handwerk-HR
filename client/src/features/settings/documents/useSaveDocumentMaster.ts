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
          // The original upload is immutable. Retain its still-valid URL so a
          // newly signed URL does not reload the comparison iframe on every save.
          let sourceUrl = saved.sourceUrl;
          if (previous?.sourceUrl) {
            const previousUrl = new URL(
              previous.sourceUrl,
              window.location.origin
            );
            const date = previousUrl.searchParams.get('X-Amz-Date');
            const seconds = Number(
              previousUrl.searchParams.get('X-Amz-Expires')
            );
            const issued =
              date && /^\d{8}T\d{6}Z$/.test(date)
                ? Date.parse(
                    `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T${date.slice(9, 11)}:${date.slice(11, 13)}:${date.slice(13, 15)}Z`
                  )
                : null;
            if (
              issued === null ||
              issued + seconds * 1000 > Date.now() + 60_000
            )
              sourceUrl = previous.sourceUrl;
          }
          return { ...previous, ...saved, sourceUrl };
        }
      );
      // The saved detail is already authoritative. Refresh only the list, not
      // this active editor (which used to flash/reload after each save).
      queryClient.invalidateQueries({
        queryKey: [DOCUMENT_MASTERS_KEY],
        exact: true,
      });
    },
  });
}
