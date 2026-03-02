import API from '@/config/apiClient';
import { AddWorker } from '@/features/worker-lifecycle/schemas/zod.schemas';
import { DeleteUser, ItemUser, WorkerItem } from '../types/index.types';

export const fetchNameData = async (): Promise<WorkerItem[]> => {
  const response = API.get<WorkerItem[], WorkerItem[]>(
    '/offboarding/fetchData'
  );
  return response;
};

export const deleteTaskApi = async (taskId: number): Promise<DeleteUser> => {
  const response = await API.delete<DeleteUser, DeleteUser>(
    `/offboarding/delete/${taskId}`
  );
  return response;
};

export const addWorker = async (data: AddWorker): Promise<ItemUser> => {
  const response = await API.post<ItemUser, ItemUser>(
    '/offboarding/postoffboardingdata',
    {
      data,
    }
  );
  return response;
};
