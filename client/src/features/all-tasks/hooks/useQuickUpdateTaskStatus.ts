import queryClient from '@/config/query.client';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateTask } from '../api/tasks.api';
import type { IssueStatusValue } from '../consts/issue-status.consts';
import { FETCHDESCRIPTION } from '../consts/query.consts';
import type { IssueResponse } from '../types/index.types';

type UpdateTaskStatusVariables = {
  taskId: string;
  status: IssueStatusValue;
};

type OptimisticContext = {
  previousTasks?: IssueResponse[];
  previousWorker?: WorkerDetailResponse;
};

function patchTaskStatusInWorker(
  worker: WorkerDetailResponse,
  taskId: string,
  status: IssueStatusValue
): WorkerDetailResponse {
  return {
    ...worker,
    data: {
      ...worker.data,
      engagements: worker.data.engagements.map((engagement) => ({
        ...engagement,
        issues: engagement.issues?.map((issue) =>
          issue.id === taskId ? { ...issue, status } : issue
        ),
      })),
    },
  };
}

export function useQuickUpdateTaskStatus(workerId?: string) {
  return useMutation({
    mutationFn: ({ taskId, status }: UpdateTaskStatusVariables) =>
      updateTask({ taskId, data: { status } }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: [FETCHDESCRIPTION] });
      if (workerId) {
        await queryClient.cancelQueries({ queryKey: [WORKERBYID, workerId] });
      }

      const previousTasks = queryClient.getQueryData<IssueResponse[]>([
        FETCHDESCRIPTION,
      ]);
      const previousWorker = workerId
        ? queryClient.getQueryData<WorkerDetailResponse>([
            WORKERBYID,
            workerId,
          ])
        : undefined;

      if (previousTasks) {
        queryClient.setQueryData<IssueResponse[]>(
          [FETCHDESCRIPTION],
          previousTasks.map((task) =>
            task.id === taskId ? { ...task, status } : task
          )
        );
      }

      if (previousWorker && workerId) {
        queryClient.setQueryData<WorkerDetailResponse>(
          [WORKERBYID, workerId],
          patchTaskStatusInWorker(previousWorker, taskId, status)
        );
      }

      return { previousTasks, previousWorker } satisfies OptimisticContext;
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData([FETCHDESCRIPTION], context.previousTasks);
      }
      if (context?.previousWorker && workerId) {
        queryClient.setQueryData(
          [WORKERBYID, workerId],
          context.previousWorker
        );
      }
      toast.error('Status konnte nicht aktualisiert werden.');
    },
    onSettled: (_data, _error, { taskId }) => {
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
      if (workerId) {
        void queryClient.invalidateQueries({
          queryKey: [WORKERBYID, workerId],
        });
      }
    },
  });
}
