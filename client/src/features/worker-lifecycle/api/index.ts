import API from '@/config/apiClient';
import { delete_user, OffboardingItem, TOffboardingItemUser } from '../types';
import { FormInputs } from '@/zod-schemas/zodSchema';

export const fetchNameData = async (): Promise<OffboardingItem[]> => {
  const response = API.get<OffboardingItem[], OffboardingItem[]>(
    '/offboarding/fetchData'
  );
  return response;
};

export const deleteTaskApi = async (taskId: number): Promise<delete_user> => {
  const response = await API.delete<delete_user, delete_user>(
    `/offboarding/delete/${taskId}`
  );
  return response;
};

export const postOffboardingData = async (
  data: FormInputs
): Promise<TOffboardingItemUser> => {
  const response = await API.post<TOffboardingItemUser, TOffboardingItemUser>(
    '/offboarding/postoffboardingdata',
    {
      data,
    }
  );
  return response;
};
