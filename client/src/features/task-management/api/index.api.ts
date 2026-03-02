import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
import {
  DescriptionFieldResponse,
  EditDescriptionForm,
  SuccessResponse,
} from '@/types/api.types';
import {
  File_Request,
  HistoryData,
  InsertHistoryData,
} from '../types/index.types';

export const formattedData = async (
  id: number,
  param: string
): Promise<DescriptionFieldResponse> => {
  const response = await API.get<
    DescriptionFieldResponse,
    DescriptionFieldResponse
  >(`offboarding/user/${id}?param1=${param}`);
  return response;
};

export const insertHistoryData = async (
  result: InsertHistoryData,
  user: User
) => {
  const response = await API.post(`offboarding/editHisoryData`, {
    result,
    user,
  });
  return response;
};

export const editData = async (formData: EditDescriptionForm) => {
  const response = await API.put<SuccessResponse, SuccessResponse>(
    'offboarding/editdata',
    formData
  );

  return response;
};

export const getHistoryData = async (id: number): Promise<HistoryData[]> => {
  const response = await API.get<HistoryData[], HistoryData[]>(
    `/offboarding/getHistoryData/${id}`
  );
  return response;
};

export const fetchFileData = async (id: number): Promise<File_Request[]> => {
  const response = API.get<File_Request[], File_Request[]>(
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
): Promise<Pick<SuccessResponse, 'success'>> => {
  return API.delete(`offboarding/deleteFileData/${id}`);
};
