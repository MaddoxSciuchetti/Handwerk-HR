export type FormType = 'Onboarding' | 'Offboarding';

export type EmployeeForm = {
  form_type: FormType;
};

export type WorkerItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
  archivedAt: string | null;
  archivedBy: string | null;
  archivedByName: string | null;
};

export type WorkerListMode = 'active' | 'archived';

export type DeleteUser = {
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

export type ItemUser = {
  success: {
    id: number;
    vorname: string;
    nachname: string;
  };
};
