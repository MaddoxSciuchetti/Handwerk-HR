import API from '@/config/apiClient';
import { user } from '@/lib/api';

export const deleteEmployeeHandler = async (id: string): Promise<user> => {
  console.log('id in api', id);
  const response = await API.delete<typeof id, user>(
    `/user/deleteEmplyoee/${id}`
  );
  return response;
};
