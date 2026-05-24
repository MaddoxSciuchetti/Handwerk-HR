import queryClient from '@/config/query.client';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateEngagement } from '../api';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';
import type { EngagementProgressValue } from '../consts/engagement-progress.consts';
import type { WorkerRecord } from '../types/index.types';

type UpdateEngagementProgressVariables = {
  workerId: string;
  engagementId: string;
  status: EngagementProgressValue;
};

type OptimisticContext = {
  previousWorkers?: WorkerRecord[];
};

function patchEngagementStatusInWorkers(
  workers: WorkerRecord[],
  workerId: string,
  engagementId: string,
  status: EngagementProgressValue
): WorkerRecord[] {
  return workers.map((worker) => {
    if (worker.id !== workerId) return worker;

    return {
      ...worker,
      engagements: worker.engagements.map((engagement) =>
        engagement.id === engagementId ? { ...engagement, status } : engagement
      ),
    };
  });
}

export function useQuickUpdateEngagementProgress() {
  return useMutation({
    mutationFn: ({
      workerId,
      engagementId,
      status,
    }: UpdateEngagementProgressVariables) =>
      updateEngagement(workerId, engagementId, { status }),
    onMutate: async ({ workerId, engagementId, status }) => {
      await queryClient.cancelQueries({ queryKey: [ALL_WORKER_DATA] });

      const previousWorkers = queryClient.getQueryData<WorkerRecord[]>([
        ALL_WORKER_DATA,
      ]);

      if (previousWorkers) {
        queryClient.setQueryData<WorkerRecord[]>(
          [ALL_WORKER_DATA],
          patchEngagementStatusInWorkers(
            previousWorkers,
            workerId,
            engagementId,
            status
          )
        );
      }

      return { previousWorkers } satisfies OptimisticContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkers) {
        queryClient.setQueryData([ALL_WORKER_DATA], context.previousWorkers);
      }
      toast.error('Status konnte nicht aktualisiert werden.');
    },
    onSettled: (_data, _error, { workerId }) => {
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID, workerId] });
    },
  });
}
