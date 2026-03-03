import API from '@/config/apiClient';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { DeleteUser, ItemUser, WorkerItem } from '../types/index.types';

export const getWorkerData = async (): Promise<WorkerItem[]> => {
  const response = API.get<WorkerItem[], WorkerItem[]>('/worker/getWorkerData');
  return response;
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
