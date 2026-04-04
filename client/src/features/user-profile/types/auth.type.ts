export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; // match your DB enum exactly

export type User = {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  displayName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  isEmailVerified: boolean;
  status: UserStatus;
};

export type Auth = {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
};
