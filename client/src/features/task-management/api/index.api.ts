import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';
import {
  SuccessResponse,
  EditDescriptionForm as UpdateWorkerDescription,
} from '@/types/api.types';
import {
  CreateWorkerTaskPayload,
  File_Request,
  HistoryData,
  InsertHistoryData,
  UpdatePayload,
} from '../types/index.types';

export const getWorkerById = async (
  workerId: string
): Promise<WorkerDetailResponse> => {
  return API.get<WorkerDetailResponse, WorkerDetailResponse>(
    `worker/${workerId}`
  );
};

export const updateWorkerHistory = async (
  result: InsertHistoryData,
  user: User
) => {
  const response = await API.post(`worker/updateWorkerHistory`, {
    result,
    user,
  });
  return response;
};

export const updateWorkerData = async (formData: UpdateWorkerDescription) => {
  const response = await API.put<
    SuccessResponse<string>,
    SuccessResponse<string>
  >('worker/updateWorker', formData);

  return response;
};

export const getWorkerHistory = async (id: number): Promise<HistoryData[]> => {
  const response = await API.get<HistoryData[], HistoryData[]>(
    `worker/getWorkerHistory/${id}`
  );
  return response;
};

export const getWorkerFiles = async (id: number): Promise<File_Request[]> => {
  const response = API.get<File_Request[], File_Request[]>(
    `worker/getWorkerFiles/${id}`
  );
  return response;
};

export const fetchCloudUrl = async (cloud_key: string): Promise<string> => {
  const response = await API.get<string, string>(
    `worker/getCloudUrl?cloud_key=${encodeURIComponent(cloud_key)}`,
    { responseType: 'blob' }
  );
  return response;
};

export const deleteWorkerFile = async (
  id: number
): Promise<SuccessResponse<string>> => {
  return API.delete(`worker/deleteWorkerFile/${id}`);
};

export const updateData = async (data: UpdatePayload, workerId: number) => {
  return await API.put('/worker/singleWorkerDataPoint', { ...data, workerId });
};

export const createWorkerTask = async (
  workerId: number,
  data: CreateWorkerTaskPayload
) => {
  return await API.post(`/worker/createWorkerTask/${workerId}`, data);
};
