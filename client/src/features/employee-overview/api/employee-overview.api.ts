import { user } from '@/apis/index.apis';
import API from '@/config/apiClient';

import { DescriptionFieldResponse } from '@/types/api.types';
import { TEmployeeResponse, ZEmployeeData } from '../schemas/schema';
import { AbsenceData } from '../types/index.types';

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
): Promise<DescriptionFieldResponse> => {
  return API.get(`offboarding/user/${id}?param1=${form_type}`);
};

export const editEmployeeAbsence = async (
  data: AbsenceData
): Promise<AbsenceData> => {
  return API.put<AbsenceData, AbsenceData>('/user/editAbsenceData', data);
};
