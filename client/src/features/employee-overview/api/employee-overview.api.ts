import API from '@/config/apiClient';

import { User } from '@/features/user-profile/types/auth.type';
import { DescriptionFieldResponse } from '@/types/api.types';
import { EmployeeDataArray, employeeDataSchema } from '../schemas/schema';
import { AbsenceData } from '../types/index.types';

export const deleteEmployeeHandler = async (id: string): Promise<User> => {
  const response = await API.delete<typeof id, User>(
    `/employee/deleteEmplyoee/${id}`
  );
  return response;
};

export const specificEmployeeData = async (): Promise<EmployeeDataArray> => {
  const response = await API.get(`/employee/specificEmployeeData`);
  return employeeDataSchema.parse(response);
};

export const fetchDescriptionData = async (
  id: number,
  form_type: string
): Promise<DescriptionFieldResponse> => {
  return API.get(`worker/getWorker/${id}?param1=${form_type}`);
};

export const editEmployeeAbsence = async (
  data: AbsenceData
): Promise<AbsenceData> => {
  return API.put<AbsenceData, AbsenceData>('/employee/editAbsenceData', data);
};
