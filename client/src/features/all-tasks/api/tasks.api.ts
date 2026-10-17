import API from '@/config/apiClient';
import { IssueResponse } from '../types/index.types';
import type { TaskHistoryCommentEntry } from '@/features/worker-task-management/types/index.types';

export type UpdateTaskParams = {
  taskId: string;
  data: unknown;
};

export const getTasks = async (): Promise<IssueResponse[]> => {
  return API.get(`/tasks/`);
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

export const runIssueSequence = async (taskId: string): Promise<unknown> => {
  return API.post(`/automation/issues/${taskId}/sequence`);
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
