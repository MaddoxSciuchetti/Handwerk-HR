import API from '@/config/apiClient';
import { SuccessResponse } from '@/types/api.types';
import { employeeWorkerSchema } from '../schemas/employeeform.schemas';
import { TSendReminderSchema } from '../types/adminModal.types';
import { EmployeeWorker } from '../types/employeeform.types';

export const EmployeeData = async (): Promise<EmployeeWorker> => {
  const response = await API.get('/user/employeeData');
  return employeeWorkerSchema.parse(response);
};

export const sendReminderWorker = async (
  data: TSendReminderSchema
): Promise<Pick<SuccessResponse, 'success'>> => {
  return API.post('/offboarding/sendReminder', data);
};
