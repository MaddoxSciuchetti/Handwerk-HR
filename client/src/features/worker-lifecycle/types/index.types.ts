import { IssueResponse } from '@/features/all-tasks/types/index.types';
import type { EngagementProgressValue } from '../consts/engagement-progress.consts';
import { LifecycleType } from '@/features/worker-task-management/types/index.types';

export type EmployeeForm = {
  form_type: LifecycleType;
};

export type WorkerItem = {
  employee_forms: EmployeeForm[];
  id: number;
  nachname: string;
  vorname: string;
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

export type WorkerStatus = 'active' | 'inactive';

export type EngagementType = 'onboarding' | 'offboarding' | 'transfer';

export type WorkerEngagement = {
  id: string;
  type: EngagementType;
  status: EngagementProgressValue;
  startDate: string | null;
  endDate: string | null;
  responsibleUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  issues?: Pick<IssueResponse, 'id' | 'status'>[];
};

export type WorkerRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string | null;
  status: WorkerStatus;
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
      Omit<WorkerEngagement, 'issues'> & {
        issues?: IssueResponse[];
      }
    >;
  };
};

export type EngagementStatus = 'active' | 'archived';
