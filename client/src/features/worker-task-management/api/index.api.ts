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
  TaskHistoryItem,
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

export const getWorkerHistory = async (id: string): Promise<HistoryData[]> => {
  const response = await API.get<HistoryData[], HistoryData[]>(
    `worker/getWorkerHistory/${id}`
  );
  return response;
};

export const getTaskHistory = async (
  taskId: string
): Promise<TaskHistoryItem[]> => {
  return API.get<TaskHistoryItem[], TaskHistoryItem[]>(
    `/tasks/${taskId}/history`
  );
};

export const getWorkerFiles = async (id: string): Promise<File_Request[]> => {
  const response = await API.get<File_Request[], File_Request[]>(
    `worker/${id}/files`
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
  workerId: string,
  fileId: string
): Promise<SuccessResponse<string>> => {
  return API.delete(`worker/${workerId}/files/${fileId}`);
};

export const updateData = async (data: UpdatePayload, workerId: string) => {
  return await API.put('/worker/singleWorkerDataPoint', { ...data, workerId });
};

export const createWorkerTask = async (
  workerId: string,
  data: CreateWorkerTaskPayload
) => {
  return await API.post(`/worker/createWorkerTask/${workerId}`, data);
};
