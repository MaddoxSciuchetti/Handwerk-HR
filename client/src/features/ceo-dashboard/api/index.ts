import API from '@/config/apiClient';
import { EmployFormSchema } from '../schemas/employeeform.schema';
import { TEmployForm } from '../types/employeeform.type';

export const EmployeeData = async (): Promise<TEmployForm> => {
  const response = await API.get('/user/employeeData');
  return EmployFormSchema.parse(response);
};
