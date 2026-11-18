import API from '@/config/apiClient';
import type { IssueResponse } from '../types/index.types';
import type { TaskHistoryCommentEntry } from '@/features/worker-task-management/types/index.types';

export type UpdateTaskParams = {
  taskId: string;
  data: unknown;
};

type TasksPage = {
  tasks: IssueResponse[];
  nextCursor: string | null;
};

/** Fetches every page (default server page size 50) so list UIs keep a full cache. */
export const getTasks = async (): Promise<IssueResponse[]> => {
  const all: IssueResponse[] = [];
  let cursor: string | undefined;
  for (;;) {
    const page = (await API.get('/tasks/', {
      params: cursor ? { cursor } : undefined,
    })) as TasksPage | IssueResponse[];
    if (Array.isArray(page)) {
      all.push(...page);
      break;
    }
    all.push(...(page.tasks ?? []));
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
};

export const createTask = async (payload: unknown): Promise<unknown> => {
  return API.post(`/tasks/`, payload);
};
export const updateTask = async ({
  taskId,
  data,
}: UpdateTaskParams): Promise<unknown> => {
  return API.patch(`/tasks/${taskId}`, data);
};

export const runIssueSequence = async (
  taskId: string,
  senderAddress?: string,
  accessGroupIds?: string[]
): Promise<unknown> => {
  return API.post(`/automation/issues/${taskId}/sequence`, {
    ...(senderAddress ? { senderAddress } : {}),
    ...(accessGroupIds ? { accessGroupIds } : {}),
  });
};

export const runTaskAutomation = async (params: {
  taskId: string;
  automation: string;
}): Promise<unknown> => {
  return API.post(`/automation/issues/${params.taskId}/run`, {
    automation: params.automation,
  });
};

export const deleteTasks = async (ids: string[]): Promise<unknown> => {
  return API.delete(`/tasks/`, { data: { ids } });
};

export type SaveTaskCommentParams = {
  taskId: string;
  body: string;
  commentId?: string | null;
  mentionUserIds?: string[];
};

export type SaveTaskCommentResult = {
  mailFailed: boolean;
  comment: Omit<TaskHistoryCommentEntry, 'kind'>;
};

export const saveTaskComment = async ({
  taskId,
  body,
  commentId,
  mentionUserIds,
}: SaveTaskCommentParams): Promise<SaveTaskCommentResult> => {
  return API.post(`/tasks/${taskId}/comments`, {
    body,
    ...(commentId ? { commentId } : {}),
    ...(mentionUserIds?.length ? { mentionUserIds } : {}),
  });
};
