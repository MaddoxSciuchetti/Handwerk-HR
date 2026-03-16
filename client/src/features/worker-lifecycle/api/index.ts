import API from '@/config/apiClient';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import {
  DeleteUser,
  ItemUser,
  WorkerItem,
  WorkerListMode,
} from '../types/index.types';

export const getWorkerData = async (
  mode: WorkerListMode = 'active'
): Promise<WorkerItem[]> => {
  const response = API.get<WorkerItem[], WorkerItem[]>(
    `/worker/getWorkerData?mode=${mode}`
  );
  return response;
};

export const archiveWorkerById = async (taskId: number): Promise<ItemUser> => {
  return API.put<unknown, ItemUser>(`/worker/archiveWorker/${taskId}`, {});
};

export const unarchiveWorkerById = async (
  taskId: number
): Promise<ItemUser> => {
  return API.put<unknown, ItemUser>(`/worker/unarchiveWorker/${taskId}`, {});
};

export const deleteWorkerById = async (taskId: number): Promise<DeleteUser> => {
  const response = await API.delete<DeleteUser, DeleteUser>(
    `/worker/deleteWorker/${taskId}`
  );
  return response;
};

export const addWorker = async (data: AddWorker): Promise<ItemUser> => {
  const response = await API.post<ItemUser, ItemUser>('/worker/addWorker', {
    data,
  });
  return response;
};
