import { User } from '@/features/user-profile/types/auth.type';

export type RegisterRequest = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  confirmPassword: string;
  userAgent?: string;
};

export type RegisterResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type LoginRequest = Omit<
  RegisterRequest,
  'confirmPassword' | 'firstName' | 'lastName'
>;

export type LoginResponse = Omit<RegisterResponse, 'user'>;

export type Verify = {
  code: string;
};

export type TresetPassword = {
  verificationCode: string;
  password: string;
};
