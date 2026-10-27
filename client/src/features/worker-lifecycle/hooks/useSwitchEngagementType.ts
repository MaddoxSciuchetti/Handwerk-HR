import queryClient from '@/config/query.client';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateEngagement } from '../api';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';
import type { EngagementType, WorkerRecord } from '../types/index.types';

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
      if ((engagement.type === 'offboarding') !== (type === 'offboarding')) {
        // Match the server's separate phase creation without relabelling history.
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
      }
      return [{ ...engagement, type }];
    }),
  }));
}

export function useSwitchEngagementType() {
  return useMutation({
    mutationFn: ({ items, type }: SwitchEngagementTypeVariables) =>
      Promise.all(
        items.map((item) =>
          updateEngagement(item.workerId, item.engagementId, { type })
        )
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
