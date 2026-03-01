import API from '@/config/apiClient';
import { EmployeexWorkerData } from '../schemas/employeeform.schemas';
import { TEmployeeForm } from '../types/employeeform.types';

export const EmployeeData = async (): Promise<TEmployeeForm> => {
  const response = await API.get('/user/employeeData');
  return EmployeexWorkerData.parse(response);
};
