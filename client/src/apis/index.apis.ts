import { TFeatureForm } from '@/components/layout/sidebar/FeatureModal';
import API from '@/config/apiClient';
import { TSendReminderSchema } from '@/features/ceo-dashboard/types/adminModal.types';
import { File_Request } from '@/features/task-management/components/WorkerFileUploads';
import {
  AbsenceData,
  FileResponse,
  Session_API,
  TDescriptionData,
} from '@/types/api.types';
import { ZDescriptionData } from '@/zod-schemas/schema';
import { User } from 'shared_prisma_types';
import z from 'zod';

export const logout = async () => API.get('/auth/logout');

export type user = {
  id: number;
  updatedAt: string;
  email: string;
  verified: boolean;
  createdAt: string;
  user_permission: 'CHEF' | 'MITARBEITER';
};

export const getUser = async (): Promise<User> => {
  return API.get<User, User>('/user');
};

export const getSessions = async (): Promise<Session_API> =>
  API.get('/sessions');
export const deleteSession = async (id: string): Promise<void> =>
  API.delete(`/sessions/${id}`);

export const getHistoryData = async (id: number): Promise<any> => {
  const response = await API.get(`/offboarding/getHistoryData/${id}`);
  return response;
};

export const postFile = async (
  files: File[],
  id: number
): Promise<FileResponse> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await API.post<any, FileResponse>(
    `/offboarding/editdata/file/${id}`,

    formData
  );
  return response;
};

export const fetchFileData = async (id: number): Promise<File_Request[]> => {
  const response = API.get<any, File_Request[]>(
    `/offboarding/getFileData/file/${id}`
  );
  return response;
};

export const fetchCloudUrl = async (cloud_key: string): Promise<string> => {
  const response = await API.get<string, string>(
    `/offboarding/getCloudUrl?cloud_key=${encodeURIComponent(cloud_key)}`,
    { responseType: 'blob' }
  );
  return response;
};

export const deleteFileData = async (
  id: number
): Promise<{ message: string }> => {
  return API.delete(`offboarding/deleteFileData/${id}`);
};

export const verifyChef = async (): Promise<user> => {
  return API.get(`/user/chefpermission`);
};

export const sendReminderWorker = async (
  data: TSendReminderSchema
): Promise<unknown> => {
  console.log(data);
  return API.post('/offboarding/sendReminder', data);
};

export const editEmployeeAbsence = async (
  data: AbsenceData
): Promise<AbsenceData> => {
  return API.put<AbsenceData, AbsenceData>('/user/editAbsenceData', data);
};

export type DescriptionData = z.infer<typeof ZDescriptionData>;

export const fetchRawDescription = async (): Promise<DescriptionData> => {
  const response = await API.get('/user/rawdescription');
  console.log(response);
  return ZDescriptionData.parse(response);
};

export type EditDescriptionData = {
  form_field_id: number | undefined;
  description: string | null;
  owner: string;
};

export const editTaskData = async (data: EditDescriptionData) => {
  const response = await API.put<EditDescriptionData, EditDescriptionData>(
    `/user/editTaskData/${data.form_field_id}`,
    data
  );
  return response;
};

export const addDescriptionData = async (
  data: Omit<TDescriptionData, 'form_field_id'>
) => {
  console.log('data in api', data);
  const response = await API.post(`/user/createTaskData`, data);
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
