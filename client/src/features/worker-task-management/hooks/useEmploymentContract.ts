import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { StyledDocument } from '@/features/settings/documents/styledDocument';
import {
  confirmEngagementContractForSend,
  getEngagementContract,
  resyncEngagementContractFromQuestionnaire,
  saveEngagementContractDraft,
  type EmploymentContractDraft,
} from '../api/employmentContract.api';

export type EmploymentContractDraftInput = {
  values: Record<string, string>;
  document?: StyledDocument;
};

export function employmentContractKey(workerId: string, engagementId: string) {
  return ['employment-contract', workerId, engagementId] as const;
}

export function useEmploymentContract(
  workerId: string,
  engagementId: string | null
) {
  return useQuery({
    queryKey: employmentContractKey(workerId, engagementId ?? ''),
    queryFn: () => getEngagementContract(workerId, engagementId ?? ''),
    enabled: Boolean(engagementId),
  });
}

export function useSaveEmploymentContract(
  workerId: string,
  engagementId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: EmploymentContractDraftInput | Record<string, string>
    ) => {
      if (
        typeof input === 'object' &&
        input !== null &&
        'values' in input &&
        typeof input.values === 'object' &&
        input.values !== null &&
        !Array.isArray(input.values)
      ) {
        const draft = input as EmploymentContractDraftInput;
        return draft.document
          ? saveEngagementContractDraft(
              workerId,
              engagementId,
              draft.values,
              draft.document
            )
          : saveEngagementContractDraft(workerId, engagementId, draft.values);
      }
      return saveEngagementContractDraft(
        workerId,
        engagementId,
        input as Record<string, string>
      );
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<EmploymentContractDraft>(
        employmentContractKey(workerId, engagementId),
        saved
      );
    },
  });
}

export function useResyncEmploymentContract(
  workerId: string,
  engagementId: string,
  beforeSync?: () => Promise<unknown>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await beforeSync?.();
      return resyncEngagementContractFromQuestionnaire(workerId, engagementId);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData<EmploymentContractDraft>(
        employmentContractKey(workerId, engagementId),
        saved
      );
    },
  });
}

export function useConfirmEngagementContractForSend(
  workerId: string,
  engagementId: string
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => confirmEngagementContractForSend(workerId, engagementId),
    onSuccess: (saved) => {
      queryClient.setQueryData<EmploymentContractDraft>(
        employmentContractKey(workerId, engagementId),
        saved
      );
    },
  });
}
