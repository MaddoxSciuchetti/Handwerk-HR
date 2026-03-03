import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
import {
  DescriptionFieldResponse,
  SuccessResponse,
  EditDescriptionForm as UpdateWorkerDescription,
} from '@/types/api.types';
import {
  File_Request,
  HistoryData,
  InsertHistoryData,
} from '../types/index.types';

export const getWorkerById = async (
  id: number,
  param: string
): Promise<DescriptionFieldResponse> => {
  const response = await API.get<
    DescriptionFieldResponse,
    DescriptionFieldResponse
  >(`worker/getWorker/${id}?param1=${param}`);
  return response;
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
  const response = await API.put<SuccessResponse, SuccessResponse>(
    'worker/updateWorker',
    formData
  );

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
): Promise<Pick<SuccessResponse, 'success'>> => {
  return API.delete(`worker/deleteWorkerFile/${id}`);
};
