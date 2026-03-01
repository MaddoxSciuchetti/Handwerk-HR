import { TFeatureForm } from '@/components/layout/sidebar/FeatureModal';
import API from '@/config/apiClient';
import { FileResponse } from '@/types/api.types';

export const logout = async () => API.get('/auth/logout');

export type user = {
  id: number;
  updatedAt: string;
  email: string;
  verified: boolean;
  createdAt: string;
  user_permission: 'CHEF' | 'MITARBEITER';
};

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

// export const verifyChef = async (): Promise<user> => {
//   return API.get(`/user/chefpermission`);
// };
// export type DescriptionData = z.infer<typeof ZDescriptionData>;

// export const fetchRawDescription = async (): Promise<DescriptionData> => {
//   const response = await API.get('/user/rawdescription');
//   console.log(response);
//   return ZDescriptionData.parse(response);
// };

// export const addDescriptionData = async (
//   data: Omit<TDescriptionData, 'form_field_id'>
// ) => {
//   console.log('data in api', data);
//   const response = await API.post(`/user/createTaskData`, data);
//   return response;
// };
