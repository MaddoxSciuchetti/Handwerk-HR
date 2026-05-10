import API from '@/config/apiClient';
import { IssueResponse } from '../types/index.types';

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

export const deleteTasks = async (ids: string[]): Promise<unknown> => {
  return API.delete(`/tasks/`, { data: { ids } });
};

export type SaveTaskCommentParams = {
  taskId: string;
  body: string;
  commentId?: string | null;
};

export const saveTaskComment = async ({
  taskId,
  body,
  commentId,
}: SaveTaskCommentParams): Promise<unknown> => {
  return API.post(`/tasks/${taskId}/comments`, {
    body,
    ...(commentId ? { commentId } : {}),
  });
};
