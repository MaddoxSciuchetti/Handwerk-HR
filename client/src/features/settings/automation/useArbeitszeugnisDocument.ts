import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAutomationDocument,
  saveAutomationDocument,
} from './automationDocument.api';

export const ARBEITSZEUGNIS_AUTOMATION = 'arbeitszeugnis';

const automationDocumentKey = ['automation', 'documents', ARBEITSZEUGNIS_AUTOMATION] as const;

export function useArbeitszeugnisDocument() {
  return useQuery({
    queryKey: automationDocumentKey,
    queryFn: () => getAutomationDocument(ARBEITSZEUGNIS_AUTOMATION),
  });
}

export function useSaveArbeitszeugnisDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentMasterId: string) =>
      saveAutomationDocument({
        automation: ARBEITSZEUGNIS_AUTOMATION,
        documentMasterId,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: automationDocumentKey });
    },
  });
}
