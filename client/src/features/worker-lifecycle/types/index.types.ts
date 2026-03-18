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

export type WorkerOverviewField = {
  id: number;
  form_field_id: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  owner_id: number;
  is_substitute: boolean;
  status: string;
  edit: string | null;
};

export type WorkerOverviewResponse = {
  worker: {
    id: number;
    vorname: string;
    nachname: string;
    email: string | null;
    geburtsdatum: string | null;
    adresse: string | null;
    eintrittsdatum: string | null;
    austrittsdatum: string | null;
    position: string | null;
  };
  form: {
    id: number;
    type: FormType;
    fields: WorkerOverviewField[];
  };
};
