import API from '@/config/apiClient';

import { Session_API, SuccessResponse } from '@/types/api.types';

import { User } from '@/features/user-profile/types/auth.type';
import {
  AcceptInviteRequest,
  AcceptInviteResponse,
  CreateInviteRequest,
  CreateInviteResponse,
  InviteDetailsResponse,
  LoginRequest,
  LoginResponse,
  RegisterOrgRequest,
  RegisterOrgResponse,
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
  return API.get<User, User>('/user/v2');
};

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return API.post<LoginRequest, LoginResponse>('/auth/v2/login', data);
};
export const signup = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  return API.post<RegisterRequest, RegisterResponse>('/auth/register', data);
};

export const signupOrg = async (
  data: RegisterOrgRequest
): Promise<RegisterOrgResponse> => {
  return API.post<RegisterOrgRequest, RegisterOrgResponse>(
    '/auth/v2/register/org',
    data
  );
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

export const createOrgInvite = async (
  data: CreateInviteRequest
): Promise<CreateInviteResponse> =>
  API.post<CreateInviteRequest, CreateInviteResponse>('/org/invite', data);

export const getInviteDetails = async (
  token: string
): Promise<InviteDetailsResponse> =>
  API.get<unknown, InviteDetailsResponse>(`/invites/${token}`);

export const acceptInvite = async (
  token: string,
  data: AcceptInviteRequest
): Promise<AcceptInviteResponse> =>
  API.post<AcceptInviteRequest, AcceptInviteResponse>(
    `/invites/${token}/accept`,
    data
  );
