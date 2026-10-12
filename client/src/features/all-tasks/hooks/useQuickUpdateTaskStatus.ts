import queryClient from '@/config/query.client';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  patchTaskInCaches,
  restoreTaskCaches,
  snapshotTaskCaches,
  type TaskCacheSnapshot,
} from '../query-options/mutations/optimisticTaskCache';
import { updateTask } from '../api/tasks.api';
import type { IssueStatusValue } from '../consts/issue-status.consts';
import { FETCHDESCRIPTION } from '../consts/query.consts';

type UpdateTaskStatusVariables = {
  taskId: string;
  status: IssueStatusValue;
};

export function useQuickUpdateTaskStatus() {
  return useMutation<
    unknown,
    Error,
    UpdateTaskStatusVariables,
    { previous: TaskCacheSnapshot }
  >({
    mutationFn: ({ taskId, status }) =>
      updateTask({ taskId, data: { status } }),
    onMutate: async ({ taskId, status }) => {
      const previous = await snapshotTaskCaches();
      patchTaskInCaches(taskId, { status });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) restoreTaskCaches(context.previous);
      toast.error('Status konnte nicht aktualisiert werden.');
    },
    onSettled: (_data, _error, { taskId }) => {
      void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
      void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
      void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
    },
  });
}
