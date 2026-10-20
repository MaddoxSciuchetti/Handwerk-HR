import queryClient from '@/config/query.client';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateEngagement } from '../api';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';

export function useChangeResponsibleUser() {
  return useMutation({
    mutationFn: ({
      workerId,
      engagementId,
      userId,
    }: {
      workerId: string;
      engagementId: string;
      userId: string;
    }) =>
      updateEngagement(workerId, engagementId, { responsibleUserId: userId }),
    onError: () =>
      toast.error('Verantwortlicher konnte nicht geändert werden.'),
    onSettled: async (_data, _error, { workerId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] }),
        queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] }),
      ]);
    },
  });
}
