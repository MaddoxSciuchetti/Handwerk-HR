import API from '@/config/apiClient';
import { User } from '@/features/user-profile/types/auth.type';
import { TFile } from '@/features/user-profile/types';
import { ProfileUpdateInput } from './profile.schemas';

export const getProfilePhotoV2 = async (): Promise<string> =>
  API.get<string, string>('/user/v2/profile/photo');

export const updateProfileInformation = async (
  data: ProfileUpdateInput
): Promise<User> =>
  API.post<ProfileUpdateInput, User>('/user/v2/updateProfileInformation', data);

export const uploadProfilePhotoV2 = async (data: TFile) => {
  const form = new FormData();
  form.append('file', data.file[0]);

  return API.post<FormData, { success: string }>('/user/v2/profile/photo', form);
};
