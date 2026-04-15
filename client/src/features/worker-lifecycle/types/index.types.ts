import { LifecycleType } from '@/features/task-management/types/index.types';

export type EmployeeForm = {
  form_type: LifecycleType;
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
    type: LifecycleType;
    fields: WorkerOverviewField[];
  };
};

export type WorkerStatus = 'active' | 'inactive' | 'archived';

export type EngagementType = 'onboarding' | 'offboarding' | 'transfer';

export type WorkerEngagement = {
  id: string;
  type: EngagementType;
  startDate: string | null;
  endDate: string | null;
  engagementStatus: {
    id: string;
    name: string;
    color: string | null;
  };
  responsibleUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

export type WorkerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string | null;
  status: WorkerStatus;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  engagements: WorkerEngagement[];
};

export type WorkerDetailResponse = {
  success: boolean;
  data: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    birthday: string | null;
    position: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    entryDate: string | null;
    exitDate: string | null;
    engagements: Array<
      WorkerEngagement & {
        issues?: Array<{ id: string }>;
      }
    >;
  };
};

export type EngagementStatus = 'active' | 'archived';
