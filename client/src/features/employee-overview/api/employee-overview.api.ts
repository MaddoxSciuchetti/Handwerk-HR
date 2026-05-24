import API from '@/config/apiClient';

import {
  DescriptionFieldResponse,
  EmployeeInfoResponse,
} from '@/types/api.types';
import { EmployeeDataArray, employeeDataSchema } from '../schemas/schema';
import { AbsenceData } from '../types/index.types';

export type DeleteEmployeeResponse = { message: string };

export const deleteEmployeeHandler = async (
  id: string
): Promise<DeleteEmployeeResponse> => {
  return API.delete<typeof id, DeleteEmployeeResponse>(
    `/employee/v2/deleteEmplyoee/${id}`
  );
};

export const specificEmployeeData = async (): Promise<EmployeeDataArray> => {
  const response = await API.get(`/employee/v2/specificEmployeeData`);
  return employeeDataSchema.parse(response);
};

export const fetchDescriptionData = async (
  id: number,
  form_type: string
): Promise<DescriptionFieldResponse> => {
  return API.get(`worker/getWorker/${id}?lifecycleType=${form_type}`);
};

export const editEmployeeAbsence = async (
  data: AbsenceData
): Promise<AbsenceData> => {
  return API.put<AbsenceData, AbsenceData>(
    '/employee/v2/editAbsenceData',
    data
  );
};

export const getEmployeeById = async (
  id: string
): Promise<EmployeeInfoResponse> => {
  return API.get(`/employee/v2/getEmployeeById/${id}`);
};
