import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
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
import { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';

export const getWorkerById = async (
  workerId: string,
): Promise<WorkerDetailResponse> => {
  return API.get<WorkerDetailResponse, WorkerDetailResponse>(`worker/${workerId}`);
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

export const updateData = async (data: UpdatePayload, workerId: string) => {
  return await API.put('/worker/singleWorkerDataPoint', { ...data, workerId });
};

export const createWorkerTask = async (
  workerId: string | number,
  data: CreateWorkerTaskPayload
) => {
  return await API.post(`/worker/createWorkerTask/${workerId}`, data);
};

export type IssueStatusOption = {
  id: string;
  name: string;
  color: string | null;
};

export type CreateWorkerIssuePayload = {
  workerEngagementId: string;
  createdByUserId: string;
  statusId: string;
  title: string;
  assigneeUserId?: string;
  description?: string;
  priority?: 'urgent' | 'high' | 'medium' | 'low' | 'no_priority';
};

export const getWorkerIssueStatuses = async (
  workerId: string
): Promise<IssueStatusOption[]> => {
  const res = (await API.get(
    `worker/${workerId}/issue-statuses`
  )) as { success: boolean; data: IssueStatusOption[] };
  return res.data ?? [];
};

export const createWorkerIssue = async (
  workerId: string,
  body: CreateWorkerIssuePayload
) => {
  return API.post(`worker/${workerId}/issues`, body);
};
