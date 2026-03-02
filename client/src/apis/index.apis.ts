import { TFeatureForm } from '@/components/layout/sidebar/FeatureModal';
import API from '@/config/apiClient';
import { FileResponse } from '@/types/api.types';

export const logout = async () => API.get('/auth/logout');

export const postFile = async (
  files: File[],
  id: number
): Promise<FileResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await API.post<FileResponse, FileResponse>(
    `/offboarding/editdata/file/${id}`,
    formData
  );
  return response;
};

export const featureRequest = async (data: TFeatureForm) => {
  const form = new FormData();
  if (data.file === undefined) {
    form.append('importance', data.importance);
    form.append('text', data.textarea);
  } else {
    data.file.forEach((file) => form.append('files', file));
    form.append('importance', data.importance);
    form.append('text', data.textarea);
  }

  const response = await API.post<TFeatureForm, TFeatureForm>(
    `/offboarding/FeatureRequest`,
    form
  );
  return response;
};
