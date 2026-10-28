import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateEngagement } from '../api';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';
import type {
  EngagementType,
  WorkerDetailResponse,
  WorkerRecord,
} from '../types/index.types';
import { cacheSavedEngagement } from '../utils/cacheSavedEngagement';

type SwitchTarget = {
  workerId: string;
  engagementId: string;
};

type SwitchEngagementTypeVariables = {
  items: SwitchTarget[];
  type: EngagementType;
};

type OptimisticContext = {
  previousWorkers?: WorkerRecord[];
};

function patchEngagementType(
  workers: WorkerRecord[],
  items: SwitchTarget[],
  type: EngagementType
): WorkerRecord[] {
  const engagementIds = new Set(items.map((item) => item.engagementId));

  return workers.map((worker) => ({
    ...worker,
    engagements: worker.engagements.flatMap((engagement) => {
      if (!engagementIds.has(engagement.id)) return [engagement];
      if (engagement.type === type) return [engagement];
      // Match the server's separate phase creation without relabelling history.
      // Onboarding→Team must keep the original engagement typed as onboarding
      // so its tasks still appear when that phase is viewed later.
      return [
        {
          ...engagement,
          id: `pending:${engagement.id}:${type}`,
          type,
          status:
            type === 'transfer'
              ? ('completed' as const)
              : ('pending' as const),
          issues: [],
          issueCounts: [],
          templateApplication: null,
        },
        engagement,
      ];
    }),
  }));
}

export function useSwitchEngagementType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ items, type }: SwitchEngagementTypeVariables) =>
      Promise.all(
        items.map(async (item) => {
          const response = await updateEngagement(
            item.workerId,
            item.engagementId,
            { type }
          );
          // Publish each saved phase immediately, including during bulk changes.
          // Cancel old reads so they cannot overwrite the confirmed response.
          await Promise.all([
            queryClient.cancelQueries({ queryKey: [ALL_WORKER_DATA] }),
            queryClient.cancelQueries({
              queryKey: [WORKERBYID, item.workerId],
            }),
          ]);
          queryClient.setQueryData<WorkerRecord[]>(
            [ALL_WORKER_DATA],
            (workers) =>
              workers?.map((worker) =>
                worker.id === item.workerId
                  ? {
                      ...worker,
                      engagements: cacheSavedEngagement(
                        worker.engagements,
                        response.data
                      ),
                    }
                  : worker
              )
          );
          for (const key of [
            [WORKERBYID, item.workerId],
            [ALL_WORKER_DATA, 'detail', item.workerId],
          ]) {
            queryClient.setQueryData<WorkerDetailResponse>(key, (previous) =>
              previous
                ? {
                    ...previous,
                    data: {
                      ...previous.data,
                      engagements: cacheSavedEngagement(
                        previous.data.engagements,
                        response.data
                      ),
                    },
                  }
                : undefined
            );
          }
          return response;
        })
      ),
    onMutate: async ({ items, type }) => {
      const previousWorkers = queryClient.getQueryData<WorkerRecord[]>([
        ALL_WORKER_DATA,
      ]);
      const nextWorkers = previousWorkers
        ? patchEngagementType(previousWorkers, items, type)
        : undefined;

      if (nextWorkers) {
        queryClient.setQueryData<WorkerRecord[]>(
          [ALL_WORKER_DATA],
          nextWorkers
        );
      }

      await queryClient.cancelQueries({ queryKey: [ALL_WORKER_DATA] });

      if (nextWorkers) {
        queryClient.setQueryData<WorkerRecord[]>(
          [ALL_WORKER_DATA],
          nextWorkers
        );
      }

      return { previousWorkers } satisfies OptimisticContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousWorkers) {
        queryClient.setQueryData([ALL_WORKER_DATA], context.previousWorkers);
      }
      toast.error('Typ konnte nicht geändert werden.');
    },
    onSettled: (_data, _error, { items }) => {
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      for (const item of items) {
        void queryClient.invalidateQueries({
          queryKey: [WORKERBYID, item.workerId],
        });
      }
    },
  });
}
