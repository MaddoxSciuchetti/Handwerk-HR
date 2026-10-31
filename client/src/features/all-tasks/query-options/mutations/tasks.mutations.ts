import queryClient from '@/config/query.client';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import {
  TASKHISTORY,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
import { mutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  TaskHistoryActor,
  TaskHistoryItem,
} from '@/features/worker-task-management/types/index.types';
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
    mutationOptions<
      unknown,
      Error,
      UpdateTaskParams,
      { previous: TaskCacheSnapshot }
    >({
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
        void queryClient.invalidateQueries({
          queryKey: ['employment-contract'],
        });
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

  saveTaskComment: (actor?: TaskHistoryActor) =>
    mutationOptions<
      SaveTaskCommentResult,
      Error,
      SaveTaskCommentParams,
      {
        optimisticId: string;
        previousComment?: TaskHistoryItem;
      }
    >({
      mutationFn: (params) => saveTaskComment(params),
      onMutate: async ({ taskId, body, commentId }) => {
        const queryKey = [TASKHISTORY, taskId];
        await queryClient.cancelQueries({ queryKey });
        const optimisticId = commentId || `pending-${crypto.randomUUID()}`;
        const previous =
          queryClient.getQueryData<TaskHistoryItem[]>(queryKey) ?? [];
        const previousComment = previous.find(
          (entry) => entry.id === commentId && entry.kind === 'comment'
        );
        const now = new Date().toISOString();
        if (previousComment?.kind === 'comment') {
          queryClient.setQueryData<TaskHistoryItem[]>(
            queryKey,
            previous.map((entry) =>
              entry === previousComment
                ? { ...previousComment, body, updatedAt: now }
                : entry
            )
          );
        } else if (actor && !commentId) {
          queryClient.setQueryData<TaskHistoryItem[]>(queryKey, [
            {
              kind: 'comment',
              id: optimisticId,
              body,
              createdAt: now,
              updatedAt: now,
              user: actor,
            },
            ...previous,
          ]);
        }
        return { optimisticId, previousComment };
      },
      onSuccess: (result, { taskId, mentionUserIds }, context) => {
        queryClient.setQueryData<TaskHistoryItem[]>(
          [TASKHISTORY, taskId],
          (previous = []) => {
            const comment: TaskHistoryItem = {
              ...result.comment,
              kind: 'comment',
            };
            const remaining = previous.filter(
              (entry) =>
                entry.id !== context?.optimisticId && entry.id !== comment.id
            );
            return [comment, ...remaining].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            );
          }
        );
        if (mentionUserIds?.length) {
          void queryClient.invalidateQueries({ queryKey: [FETCHDESCRIPTION] });
        }
        if (result.mailFailed) {
          toast.error('Die E-Mail konnte nicht gesendet werden.');
        }
      },
      onError: (_error, { taskId }, context) => {
        if (context) {
          queryClient.setQueryData<TaskHistoryItem[]>(
            [TASKHISTORY, taskId],
            (previous = []) =>
              previous.flatMap((entry) =>
                entry.id === context.optimisticId
                  ? context.previousComment
                    ? [context.previousComment]
                    : []
                  : [entry]
              )
          );
        }
        toast.error('Nachricht konnte nicht gesendet werden.');
      },
      onSettled: (_result, _error, { taskId }) => {
        void queryClient.invalidateQueries({ queryKey: [TASKHISTORY, taskId] });
      },
    }),
};
