import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmEngagementContractForSend,
  getEngagementContract,
  saveEngagementContractDraft,
  type EmploymentContractDraft,
} from '../api/employmentContract.api';

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
    mutationFn: (values: Record<string, string>) =>
      saveEngagementContractDraft(workerId, engagementId, values),
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
