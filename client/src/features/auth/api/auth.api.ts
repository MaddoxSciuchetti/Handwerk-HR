import API from '@/config/apiClient';

import { Session_API, SuccessResponse } from '@/types/api.types';

import { User } from '@/features/user-profile/types/auth.type';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TresetPassword,
  Verify,
} from '../types/auth.types';

export const sendPasswordResetEmail = async (
  email: string
): Promise<SuccessResponse<string>> =>
  API.post('/auth/password/forgot', { email });

export const getUser = async (): Promise<User> => {
  return API.get<User, User>('/user');
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return API.post<LoginRequest, LoginResponse>('/auth/login', data);
};
export const signup = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  return API.post<RegisterRequest, RegisterResponse>('/auth/register', data);
};

export const verifyEmail = async (
  verificationCode: Verify
): Promise<string> => {
  return API.get<Verify, string>(`/auth/email/verify/${verificationCode.code}`);
};

export const getSessions = async (): Promise<Session_API> =>
  API.get('/sessions');
export const deleteSession = async (id: string): Promise<void> =>
  API.delete(`/sessions/${id}`);

export const resetPassword = async ({
  verificationCode,
  password,
}: TresetPassword): Promise<TresetPassword> =>
  API.post('/auth/password/reset', { verificationCode, password });
