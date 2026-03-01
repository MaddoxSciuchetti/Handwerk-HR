import { user } from '@/apis/index.apis';
import API from '@/config/apiClient';
import { api_Response } from '@/features/task-management/types/index.type';
import { TEmployeeResponse, ZEmployeeData } from '../schemas/schema';

export const deleteEmployeeHandler = async (id: string): Promise<user> => {
  const response = await API.delete<typeof id, user>(
    `/user/deleteEmplyoee/${id}`
  );
  return response;
};

export const specificEmployeeData = async (): Promise<TEmployeeResponse> => {
  const response = await API.get(`/user/specificEmployeeData`);
  return ZEmployeeData.parse(response);
};

export const fetchProcessData = async (
  id: number,
  form_type: string
): Promise<api_Response> => {
  return API.get(`offboarding/user/${id}?param1=${form_type}`);
};
