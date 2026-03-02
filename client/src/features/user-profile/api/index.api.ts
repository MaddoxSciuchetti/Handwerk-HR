import API from '@/config/apiClient';
import { TFile } from '../types';

export const uploadProfileFoto = async (data: TFile) => {
  const form = new FormData();
  form.append('file', data.file[0]);
  console.log('received something');
  console.log(form);
  const response = await API.post<TFile, TFile>(
    '/user/uploadProfileFoto',
    form
  );
  return response;
};

export const getProfileFoto = async (): Promise<string> => {
  const response = await API.get<string, string>('/user/getProfileFoto');
  return response;
};
