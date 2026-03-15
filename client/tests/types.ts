export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupProfile = {
  vorname: string;
  nachname: string;
  confirmpassword: string;
};

export type SignupTestUser = LoginCredentials & SignupProfile;

export type OutboxEmail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  providerId?: string;
  createdAt: string;
};

export type WorkerFixture = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  birthDate: string;
  address: string;
  entryDate: string;
  position: string;
};

export type WorkerListItem = {
  id: number;
  vorname: string;
  nachname: string;
};