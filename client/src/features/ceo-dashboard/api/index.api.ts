import API from '@/config/apiClient';
import { SuccessResponse } from '@/types/api.types';
import { employeeWorkerSchema } from '../schemas/employeeform.schemas';
import { SendReminder } from '../types/adminModal.types';
import { EmployeeWorker as EmployeeWorkerData } from '../types/employeeform.types';

export const getEmployeeWorkerData = async (): Promise<EmployeeWorkerData> => {
  const response = await API.get('/user/employeeData');
  return employeeWorkerSchema.parse(response);
};

export const sendReminderWorker = async (
  data: SendReminder
): Promise<Pick<SuccessResponse, 'success'>> => {
  return API.post('/offboarding/sendReminder', data);
};
