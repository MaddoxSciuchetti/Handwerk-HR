import API from '@/config/apiClient';
import { EmployeexWorkerData } from '../schemas/employeeform.schemas';
import { TSendReminderSchema } from '../types/adminModal.types';
import { TEmployeeForm } from '../types/employeeform.types';

export const EmployeeData = async (): Promise<TEmployeeForm> => {
  const response = await API.get('/user/employeeData');
  return EmployeexWorkerData.parse(response);
};

export const sendReminderWorker = async (
  data: TSendReminderSchema
): Promise<unknown> => {
  console.log(data);
  return API.post('/offboarding/sendReminder', data);
};
