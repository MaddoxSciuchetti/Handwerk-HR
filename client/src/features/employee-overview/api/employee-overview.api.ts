import API from '@/config/apiClient';

import { User } from '@/features/user-profile/types/auth.type';
import {
  DescriptionFieldResponse,
  EmployeeInfoResponse,
} from '@/types/api.types';
import {
  AbsenceFormData,
  OrgUsersArray,
  OrgUsersSchema,
} from '../schemas/schema';

export const deleteEmployeeHandler = async (id: string): Promise<User> => {
  const response = await API.delete<typeof id, User>(
    `/employee/v2/deleteEmplyoee/${id}`
  );
  return response;
};

export const specificEmployeeData = async (): Promise<OrgUsersArray> => {
  const response = await API.get(`/employee/v2/specificEmployeeData`);
  return OrgUsersSchema.parse(response);
};

export const fetchDescriptionData = async (
  id: string
): Promise<DescriptionFieldResponse> => {
  return API.get(`worker/${id}`);
};

export const editEmployeeAbsence = async (
  data: AbsenceFormData
): Promise<AbsenceFormData> => {
  return API.put<AbsenceFormData, AbsenceFormData>(
    '/employee/v2/editAbsenceData',
    data
  );
};

export const getEmployeeById = async (
  id: string
): Promise<EmployeeInfoResponse> => {
  return API.get(`/employee/v2/getEmployeeById/${id}`);
};
