export type User = {
  id: string;
  email: string;
  verified: boolean;
  user_permission: 'CHEF' | 'MITARBEITER';
  createdAt: Date;
  updatedAt: Date;
  vorname: string;
  nachname: string;
  cloud_url: string;
  presignedUrl?: string;
};

export type Auth = {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
};
