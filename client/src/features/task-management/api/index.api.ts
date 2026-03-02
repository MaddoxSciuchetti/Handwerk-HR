import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
import {
  insertHistoryDataType,
  SuccessResponse,
  TApiResponse,
} from '@/types/api.types';
import { DescriptionForm } from '@/types/form-data.types';
import { File_Request, THistoryData } from '../types/index.types';

export const formattedData = async (
  id: number,
  param: string
): Promise<TApiResponse> => {
  const response = await API.get<TApiResponse, TApiResponse>(
    `offboarding/user/${id}?param1=${param}`
  );
  return response;
};

export const insertHistoryData = async (
  result: insertHistoryDataType,
  user: User
) => {
  const response = await API.post(`offboarding/editHisoryData`, {
    result,
    user,
  });
  return response;
};

export const editData = async (formData: DescriptionForm) => {
  const response = await API.put<SuccessResponse, SuccessResponse>(
    'offboarding/editdata',
    formData
  );

  return response;
};

export const getHistoryData = async (id: number): Promise<THistoryData[]> => {
  const response = await API.get<THistoryData[], THistoryData[]>(
    `/offboarding/getHistoryData/${id}`
  );
  return response;
};

export const fetchFileData = async (id: number): Promise<File_Request[]> => {
  const response = API.get<any, File_Request[]>(
    `/offboarding/getFileData/file/${id}`
  );
  return response;
};

export const fetchCloudUrl = async (cloud_key: string): Promise<string> => {
  const response = await API.get<string, string>(
    `/offboarding/getCloudUrl?cloud_key=${encodeURIComponent(cloud_key)}`,
    { responseType: 'blob' }
  );
  return response;
};

export const deleteFileData = async (
  id: number
): Promise<{ message: string }> => {
  return API.delete(`offboarding/deleteFileData/${id}`);
};
