export type User = {
  id: string;
  email: string;
  verified: boolean;
  user_permission: 'CHEF' | 'MITARBEITER';
  createdAt: Date;
  updatedAt: Date;
  vorname: string;
  nachname: string;
  cloud_url: string; // ← Add this field
  presignedUrl?: string; // ← Keep this if you add it later
};

export type Auth = {
  user: User | undefined;
  isLoading: boolean;
  isError: boolean;
};
