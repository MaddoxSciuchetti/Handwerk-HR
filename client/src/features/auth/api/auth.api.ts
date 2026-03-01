import API from '@/config/apiClient';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  TresetPassword,
  Verify,
} from '../types/auth.types';

export const sendPasswordResetEmail = async (email: string) =>
  API.post('/auth/password/forgot', { email });

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return API.post<LoginRequest, LoginResponse>('/auth/login', data);
};

export const signup = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  console.log('why testUser', data);
  return API.post<RegisterRequest, RegisterResponse>('/auth/register', data);
};

export const verifyEmail = async (
  verificationCode: Verify
): Promise<string> => {
  return API.get<Verify, string>(`/auth/email/verify/${verificationCode.code}`);
};

export const resetPassword = async ({
  verificationCode,
  password,
}: TresetPassword): Promise<TresetPassword> =>
  API.post('/auth/password/reset', { verificationCode, password });
