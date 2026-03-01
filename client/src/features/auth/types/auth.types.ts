import { User } from 'shared_prisma_types';

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

export type LoginRequest = Omit<RegisterRequest, 'confirmPassword'>;

export type LoginResponse = Omit<RegisterResponse, 'user'>;

export type Verify = {
  code: string;
};

export type TresetPassword = {
  verificationCode: string;
  password: string;
};
