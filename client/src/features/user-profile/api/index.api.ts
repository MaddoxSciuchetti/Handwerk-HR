import API from '@/config/apiClient';

export const getProfilePhoto = async (): Promise<string> => {
  const response = await API.get<string, string>('/user/v2/profile/photo');
  return response;
};
