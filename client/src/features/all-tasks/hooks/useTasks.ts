import { tryCatch } from '@/lib/trycatch';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { IssueStatusValue } from '../consts/issue-status.consts';
import {
  O365_BLOCK_SIGN_IN,
  TASK_AUTOMATION_NONE,
} from '../consts/task-automation.consts';
import { taskFormSchema } from '../schemas/taskForm.schema';
import { TaskSidebarForm } from '../types/index.types';
import { useCreateTask } from './useCreateTask';
import type { TaskEditState } from './useTaskSidebar';
import { useUpdateTask } from './useUpdateTask';

export type TaskCommentDraft = {
  body: string;
  commentId: string | null;
};

export type PersistTaskComment = (args: {
  taskId: string;
  body: string;
  commentId: string | null;
}) => Promise<unknown>;

type UseTasksOptions = {
  getCommentDraft?: () => TaskCommentDraft;
  persistComment?: PersistTaskComment;
};

export function useTasks(
  taskEditState: TaskEditState,
  taskState: 'create' | 'edit',
  setIsOpen: Dispatch<SetStateAction<boolean>>,
  options?: UseTasksOptions
) {
  const { mutateAsync: createTaskAsync, isPending: isCreatePending } =
    useCreateTask();
  const { mutateAsync: updateTaskAsync, isPending: isUpdatePending } =
    useUpdateTask();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<TaskSidebarForm>({
    defaultValues: {
      title: taskEditState.title,
      workerEngagementId: taskEditState.workerEngagementId,
      assigneeUserId: taskEditState.assigneeUserId,
      status: taskEditState.status || 'open',
      automation: taskEditState.automation || TASK_AUTOMATION_NONE,
    },
    resolver: zodResolver(taskFormSchema),
  });

  useEffect(() => {
    setValue('status', (taskEditState.status || 'open') as IssueStatusValue);
    setValue(
      'automation',
      taskEditState.automation === O365_BLOCK_SIGN_IN
        ? O365_BLOCK_SIGN_IN
        : TASK_AUTOMATION_NONE
    );
  }, [taskEditState.automation, taskEditState.status, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (taskState === 'create') {
      try {
        await createTaskAsync(data);
        setIsOpen(false);
      } catch {}
      return;
    }
    try {
      await updateTaskAsync({ taskId: taskEditState.taskId, data });
    } catch {
      return;
    }

    const draft = options?.getCommentDraft?.();
    const trimmed = draft?.body.trim() ?? '';
    if (trimmed.length > 0 && options?.persistComment) {
      const [, persistErr] = await tryCatch(
        options.persistComment({
          taskId: taskEditState.taskId,
          body: trimmed,
          commentId: draft?.commentId ?? null,
        })
      );
      if (persistErr) return;
    }

    setIsOpen(false);
  });

  return {
    register,
    control,
    errors,
    setValue,
    onSubmit,
    isTaskSaving: isCreatePending || isUpdatePending,
  };
}
