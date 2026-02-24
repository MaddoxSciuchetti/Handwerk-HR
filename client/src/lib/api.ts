import { sendEmailSchema } from '@/components/admin_data/AdminModal';
import { File_Request } from '@/components/backround_worker';
import { TFeatureForm } from '@/components/modal/FeatureModal';
import API from '@/config/apiClient';
import { TEmployForm } from '@/features/CeoDashboard';
import { OffboardingItem } from '@/types/onof_home';
import { api_Response } from '@/features/OnOf_Worker_Procedure';
import { TFile } from '@/features/Profile';
import { Mappingform } from '@/types/form-data';
import { FormInputs } from '@/zod-schemas/zodSchema';
import {
  AbsenceData,
  delete_user,
  FileResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Session_API,
  SuccessResponse,
  TDescriptionData,
  TDescriptionResponse,
  TOffboardingItemUser,
} from '@/types/api';
import { User } from 'shared_prisma_types';
import z from 'zod';
import {
  EmployFormSchema,
  TEmployeeResponse,
  ZDescriptionData,
  ZEmployeeData,
} from '@/zod-schemas/schema';

export type Verify = {
  code: string;
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return API.post<LoginRequest, LoginResponse>('/auth/login', data);
};
export const signup = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  console.log('why testUser', data);
  return API.post<RegisterRequest, RegisterResponse>('/auth/register', data);
};

export const logout = async () => API.get('/auth/logout');

export const verifyEmail = async (
  verificationCode: Verify
): Promise<string> => {
  return API.get<Verify, string>(`/auth/email/verify/${verificationCode.code}`);
};

export const sendPasswordResetEmail = async (email: string) =>
  API.post('/auth/password/forgot', { email });

// export type resetPassword = {
//   verificationCode: string;
//   password: string;
// };

// export const resetPassword = async ({
//   verificationCode,
//   password,
// }: resetPassword): Promise<resetPassword> =>
//   API.post('/auth/password/reset', { verificationCode, password });

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

export const fetchProcessData = async (
  id: number,
  form_type: string
): Promise<any> => {
  return API.get(`offboarding/user/${id}?param1=${form_type}`);
};

export const verifyChef = async (): Promise<user> => {
  return API.get(`/user/chefpermission`);
};

export const fetchChefData = async (): Promise<TEmployForm> => {
  const response = await API.get('/user/employeeData');
  return EmployFormSchema.parse(response);
};

export const fetchNameData = async (): Promise<OffboardingItem[]> => {
  const response = API.get<OffboardingItem[], OffboardingItem[]>(
    '/offboarding/fetchData'
  );
  return response;
};

export const sendReminderWorker = async (
  data: sendEmailSchema
): Promise<unknown> => {
  console.log(data);
  return API.post('/offboarding/sendReminder', data);
};

export const editData = async (formData: Mappingform) => {
  return API.put<SuccessResponse, SuccessResponse>(
    'offboarding/editdata',
    formData
  );
};

export const formattedData = async (
  id: number,
  param: string
): Promise<api_Response> => {
  const response = await API.get<api_Response, api_Response>(
    `offboarding/user/${id}?param1=${param}`
  );
  return response;
};

export const specificEmployeeData = async (): Promise<TEmployeeResponse> => {
  const response = await API.get(`/user/specificEmployeeData`);
  console.log(response);
  return ZEmployeeData.parse(response);
};
export const editEmployeeAbsence = async (
  data: AbsenceData
): Promise<AbsenceData> => {
  return API.put<AbsenceData, AbsenceData>('/user/editAbsenceData', data);
};

export const deleteTaskApi = async (taskId: number): Promise<delete_user> => {
  const response = await API.delete<delete_user, delete_user>(
    `/offboarding/delete/${taskId}`
  );
  return response;
};

export const postOffboardingData = async (
  data: FormInputs
): Promise<TOffboardingItemUser> => {
  const response = await API.post<TOffboardingItemUser, TOffboardingItemUser>(
    '/offboarding/postoffboardingdata',
    {
      data,
    }
  );
  return response;
};

export const addExtraField = async (data: {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
}): Promise<any> => {
  const response = await API.post(`/offboarding/addFormField`, data);
  return response;
};

export type DescriptionData = z.infer<typeof ZDescriptionData>;

export const fetchRawDescription = async (): Promise<DescriptionData> => {
  const response = await API.get('/user/rawdescription');
  console.log(response);
  return ZDescriptionData.parse(response);
};

export const deleteEmployeeHandler = async (id: string): Promise<user> => {
  console.log('id in api', id);
  const response = await API.delete<typeof id, user>(
    `/user/deleteEmplyoee/${id}`
  );
  return response;
};

export const fetchTaskData = async (): Promise<TDescriptionResponse[]> => {
  const response = await API.get<TDescriptionData[], TDescriptionResponse[]>(
    '/user/fetchTaskData'
  );
  return response;
};

export const deleteDescriptionData = async (id: number) => {
  const response = await API.delete(`/user/deleteDescriptionData/${id}`);
  return response;
};

export type EditDescriptionData = Omit<TDescriptionData, 'template_type'>;

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
