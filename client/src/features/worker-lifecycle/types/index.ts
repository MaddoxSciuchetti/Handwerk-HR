export type FormType = 'Onboarding' | 'Offboarding';

export type EmployeeForm = {
  form_type: FormType;
};

export type OffboardingItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
};

export type delete_user = {
  id: number;
  vorname: string;
  nachname: string;
  email: string | null;
  adresse: string;
  austrittsdatum: Date | null;
  createdAt: Date;
  eintrittsdatum: Date;
  geburtsdatum: Date;
  position: string;
  updatedAt: Date;
};

export type TOffboardingItemUser = {
  success: {
    id: number;
    vorname: string;
    nachname: string;
  };
};
