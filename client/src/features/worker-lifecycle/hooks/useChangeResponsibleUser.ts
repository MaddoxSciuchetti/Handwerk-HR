import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import queryClient from '@/config/query.client';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateEngagement } from '../api';
import type { WorkerRecord } from '../types/index.types';
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
    onMutate: async ({ workerId, engagementId, userId }) => {
      await queryClient.cancelQueries({
        queryKey: [ALL_WORKER_DATA],
        exact: true,
      });
      const previousWorkers = queryClient.getQueryData<WorkerRecord[]>([
        ALL_WORKER_DATA,
      ]);
      const employees = queryClient.getQueryData(
        employeeQueries.getEmployees().queryKey
      );
      const responsible =
        employees?.find((user) => user.id === userId) ??
        previousWorkers
          ?.flatMap((worker) => worker.engagements)
          .map((engagement) => engagement.responsibleUser)
          .find((user) => user.id === userId);
      if (responsible) {
        queryClient.setQueryData<WorkerRecord[]>([ALL_WORKER_DATA], (workers) =>
          workers?.map((worker) =>
            worker.id === workerId
              ? {
                  ...worker,
                  engagements: worker.engagements.map((engagement) =>
                    engagement.id === engagementId
                      ? {
                          ...engagement,
                          responsibleUser: {
                            ...responsible,
                            email: responsible.email ?? '',
                          },
                        }
                      : engagement
                  ),
                }
              : worker
          )
        );
      }
      return { previousWorkers };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkers)
        queryClient.setQueryData([ALL_WORKER_DATA], context.previousWorkers);
      toast.error('Verantwortlicher konnte nicht geändert werden.');
    },
    onSettled: (_data, _error, { workerId }) => {
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
    },
  });
}
