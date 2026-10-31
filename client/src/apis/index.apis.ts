import API from '@/config/apiClient';
import { FileResponse } from '@/types/api.types';

export const logout = async () => API.get('/auth/v2/logout');

export const createWorkerFile = async (
  files: File[],
  id: string
): Promise<FileResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await API.post<FileResponse, FileResponse>(
    `/worker/${id}/files`,
    formData
  );
  return response;
};
