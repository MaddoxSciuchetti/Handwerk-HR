import API from '@/config/apiClient';
import { TFile } from '../types';

export const uploadProfileFoto = async (data: TFile) => {
  const form = new FormData();
  form.append('file', data.file[0]);
  const response = await API.post<TFile, TFile>('/user/v2/profile/photo', form);
  return response;
};

export const getProfilePhoto = async (): Promise<string> => {
  const response = await API.get<string, string>('/user/v2/profile/photo');
  return response;
};
