import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAutomationDocument,
  saveAutomationDocument,
  type AutomationDocumentPage,
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
  return useMutation<
    AutomationDocumentPage,
    Error,
    string,
    { previous?: AutomationDocumentPage }
  >({
    mutationFn: (documentMasterId: string) =>
      saveAutomationDocument({
        automation: ARBEITSZEUGNIS_AUTOMATION,
        documentMasterId,
      }),
    onMutate: async (documentMasterId) => {
      await queryClient.cancelQueries({ queryKey: automationDocumentKey });
      const previous = queryClient.getQueryData<AutomationDocumentPage>(
        automationDocumentKey
      );
      if (previous) {
        queryClient.setQueryData<AutomationDocumentPage>(automationDocumentKey, {
          ...previous,
          documentMasterId,
        });
      }
      return { previous };
    },
    onError: (_error, _documentMasterId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(automationDocumentKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: automationDocumentKey });
    },
  });
}
