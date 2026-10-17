import queryClient from '@/config/query.client';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createTask,
  deleteTasks,
  saveTaskComment,
  updateTask,
  type SaveTaskCommentParams,
  type SaveTaskCommentResult,
  type UpdateTaskParams,
} from '../../api/tasks.api';
import { FETCHDESCRIPTION } from '../../consts/query.consts';
import {
  patchTaskInCaches,
  readTaskPatch,
  removeTasksFromCaches,
  restoreTaskCaches,
  snapshotTaskCaches,
  type TaskCacheSnapshot,
} from './optimisticTaskCache';

export const taskMutations = {
  createTask: () =>
    mutationOptions<unknown, Error, unknown>({
      mutationFn: (payload: unknown) => createTask(payload),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
        void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
        void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    }),

  updateTask: () =>
    mutationOptions<unknown, Error, UpdateTaskParams, { previous: TaskCacheSnapshot }>({
      mutationFn: ({ taskId, data }) => updateTask({ taskId, data }),
      onMutate: async ({ taskId, data }) => {
        const previous = await snapshotTaskCaches();
        patchTaskInCaches(taskId, readTaskPatch(data));
        return { previous };
      },
      onError: (_error, _variables, context) => {
        if (context?.previous) restoreTaskCaches(context.previous);
        toast.error('Aufgabe konnte nicht gespeichert werden.');
      },
      onSettled: (_data, _error, { taskId }) => {
        void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
        void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
        void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
        void queryClient.invalidateQueries({
          queryKey: [TASKHISTORY, taskId],
        });
      },
    }),

  deleteTasks: () =>
    mutationOptions<unknown, Error, string[], { previous: TaskCacheSnapshot }>({
      mutationFn: (ids: string[]) => deleteTasks(ids),
      onMutate: async (ids) => {
        const previous = await snapshotTaskCaches();
        removeTasksFromCaches(ids);
        return { previous };
      },
      onError: (_error, _ids, context) => {
        if (context?.previous) restoreTaskCaches(context.previous);
        toast.error('Aufgaben konnten nicht gelöscht werden.');
      },
      onSettled: () => {
        void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
        void queryClient.invalidateQueries({ queryKey: [WORKERBYID] });
        void queryClient.invalidateQueries({ queryKey: [ALL_WORKER_DATA] });
      },
    }),

  saveTaskComment: () =>
    mutationOptions<SaveTaskCommentResult, Error, SaveTaskCommentParams>({
      mutationFn: (params) => saveTaskComment(params),
      onSuccess: (result, { taskId, mentionUserIds }) => {
        void queryClient.invalidateQueries({
          queryKey: [TASKHISTORY, taskId],
        });
        if (mentionUserIds?.length) {
          void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
        }
        if (result.mailFailed) {
          toast.error('Die E-Mail konnte nicht gesendet werden.');
        }
      },
      onError: () => {
        toast.error('Nachricht konnte nicht gesendet werden.');
      },
    }),
};
