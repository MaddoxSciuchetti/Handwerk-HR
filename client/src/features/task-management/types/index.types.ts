import { baseWorkerSchema } from '@/features/worker-lifecycle/schemas/zod.schemas';
import type { z } from 'zod';
import { formSchema } from '../schemas/index.schema';
import { TaskStatus } from '../utils/selectOptionTernary';

export type TAuth_User = {
  id: string;
  email: string;
  verified: boolean;
  cloud_url: string;
};

export type HistoryData = {
  id: string | number;
  timestamp: Date | null;
  status: TaskStatus;
  edit: string | null;
  form_input_id: number;
  changed_by: string | null;
  auth_user: TAuth_User | null;
};

export type File_Request = {
  id: number;
  employee_form_id: number;
  original_filename: string;
  content_type: string;
  cloud_url: string;
  cloud_key: string;
  uploaded_at: Date;
  employee_forms: {
    form_type: LifecycleType;
    id: number;
    timestamp: string;
    user_id: number;
  };
};

/** Single-field PATCH body for `PATCH /worker/:workerId/data-points` (modal edits). */
export type WorkerDataPointKey =
  | keyof z.infer<typeof baseWorkerSchema>
  | 'exitDate';

export type UpdatePayload = Partial<Record<WorkerDataPointKey, string>>;

export type LifecycleType = 'onboarding' | 'offboarding';

export type CreateWorkerTaskPayload = {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};

export type InsertHistoryData = z.infer<typeof formSchema>;

export type WorkerTab = 'form' | 'files';

export type Employees = {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isAbsent: boolean;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  organizationMembers: {
    role: {
      id: string;
      name: string;
    };
  }[];
  absences: {
    id: string;
    absenceType: 'SICK' | 'VACATION' | 'PARENTAL_LEAVE' | 'UNPAID' | 'OTHER';
    startDate: Date;
    endDate: Date;
    substitute: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  }[];
}[];
