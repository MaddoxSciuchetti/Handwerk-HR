export type User = {
  id: string;
  email: string;
  verified?: boolean;
  isEmailVerified?: boolean;
  user_permission?: 'CHEF' | 'MITARBEITER';
  createdAt: Date | string;
  updatedAt: Date | string;
  firstName?: string;
  lastName?: string;
  cloud_url?: string;
  displayName?: string;
  avatarUrl?: string;
  presignedUrl?: string;
};

export type Auth = {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
};
