import { TaskStatus } from '@/features/worker-task-management/utils/selectOptionTernary';

export type SuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
};

export type DescriptionData = {
  form_field_id: number;
  description: string | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
};
export type DescriptionResponse = DescriptionData & {
  auth_user: {
    id: number;
    vorname: string;
    nachname: string;
  };
};

export type EditDescriptionForm = {
  form_field_id: string;
  editcomment: string;
  select_option: string;
  id: string;
};

export type FileResponse = {
  employee_form_id: number;
  original_filename: string;
  file_size: number;
  content_type: string;
  cloud_url: string;
  cloud_key: string;
};

export type Session_API = {
  id: string;
  userAgent: string;
  createdAt: string;
  isCurrent: boolean;
};

export type NewDescriptionField = {
  timestamp: Date | null;
  form_field_id: number;
  description: string | null;
  order_index: number | null;
  owner: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING' | null;
};

export type DescriptionField = {
  id: number;
  form_field_id: number;
  description: string;
  officialOwner: string;
  substituteOwner: string;
  owner_id: string;
  is_substitute: boolean;
  status: TaskStatus;
  edit: string;
};

export type DescriptionFieldResponse = {
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
    type: string;
    fields: DescriptionField[];
  };
};

export type Cache = {
  createdAt: string;
  id: string;
  isCurrent: boolean;
  userAgent: string;
};

export type SessionCache = Cache[];

export type EmployeeAbsenceInfo = {
  id: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  substitute: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export type EmployeeInfoResponse = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  isVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  organizationMembers: Array<{
    membershipRole: 'admin' | 'worker';
  }>;
  absences: EmployeeAbsenceInfo[];
  isAbsent: boolean;
};
