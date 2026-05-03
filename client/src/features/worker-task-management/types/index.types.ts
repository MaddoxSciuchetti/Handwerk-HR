import { addWorkerBaseSchema } from '@/features/worker-lifecycle/schemas/zod.schemas';
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

export type DocumentFileType = 'contract' | 'id' | 'certificate' | 'other';

/** Mirrors the Prisma `WorkerDocument` model + a presigned download URL. */
export type File_Request = {
  id: string;
  workerId: string;
  uploadedByUserId: string;
  name: string;
  fileUrl: string;
  fileType: DocumentFileType;
  fileSizeBytes: number | null;
  mimeType: string | null;
  createdAt: string;
  presignedUrl: string;
};

export type UpdatePayload = Partial<
  z.infer<typeof addWorkerBaseSchema> & {
    austrittsdatum: string;
  }
>;

export type LifecycleType = 'onboarding' | 'offboarding';

export type CreateWorkerTaskPayload = {
  description: string;
  template_type: 'ONBOARDING' | 'OFFBOARDING';
  owner: string;
};

export type InsertHistoryData = z.infer<typeof formSchema>;

export type WorkerTab = 'form' | 'files';

/** Matches Prisma `IssuePriority` for template tasks. */
export type IssuePriority =
  | 'no_priority'
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

/** Form + create body for a template task (sidebar). */
export type TemplateTaskFormValues = {
  taskId: string;
  taskName: string;
  taskDescription: string;
  defaultPriority: IssuePriority;
  orderIndex: number;
};

export type TemplateTaskResponse = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  orderIndex: number;
  taskName: string;
  taskDescription: string;
  defaultPriority: IssuePriority;
};

export type TaskHistoryActor = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type TaskHistoryStatus = {
  id: string;
  name: string;
  color: string | null;
};

export type TaskHistoryChange = {
  field: string;
  from: string | null;
  to: string | null;
};

export type TaskHistoryAuditEntry = {
  kind: 'audit';
  id: string;
  action: string;
  createdAt: string;
  actorUser: TaskHistoryActor | null;
  status: TaskHistoryStatus | null;
  changes: TaskHistoryChange[];
};

export type TaskHistoryCommentEntry = {
  kind: 'comment';
  id: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: TaskHistoryActor;
};

export type TaskHistoryItem =
  | TaskHistoryAuditEntry
  | TaskHistoryCommentEntry;
