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
