import z from 'zod';
import { TAuth_User } from '../hooks/useGetWorkerHistory';
import { formSchema } from '../schemas/index.schema';
import { TaskStatus } from '../utils/selectOptionTernary';

export type HistoryData = {
  id: number;
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
    form_type: 'Onboarding' | 'Offboarding';
    id: number;
    timestamp: string;
    user_id: number;
  };
};

export type LifecycleType = 'Onboarding' | 'Offboarding';

export type InsertHistoryData = z.infer<typeof formSchema>;
