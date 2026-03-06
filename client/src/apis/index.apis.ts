import { TFeatureForm } from '@/components/layout/sidebar/FeatureModal';
import API from '@/config/apiClient';
import { FileResponse } from '@/types/api.types';

export const logout = async () => API.get('/auth/logout');

export const createWorkerFile = async (
  files: File[],
  id: number
): Promise<FileResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await API.post<FileResponse, FileResponse>(
    `/worker/createWorkerFile/${id}`,
    formData
  );
  return response;
};

export const sendFeatureRequest = async (data: TFeatureForm) => {
  const form = new FormData();
  console.log(data);
  if (data.file === undefined) {
    form.append('importance', data.importance);
    form.append('text', data.textarea);
  } else {
    data.file.forEach((file) => form.append('files', file));
    form.append('importance', data.importance);
    form.append('text', data.textarea);
  }

  const response = await API.post<TFeatureForm, TFeatureForm>(
    `/index/featurerequest`,
    form
  );
  return response;
};
