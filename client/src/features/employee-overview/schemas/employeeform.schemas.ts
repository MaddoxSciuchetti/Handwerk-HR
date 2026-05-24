import z from 'zod';
import { ISSUE_STATUSES } from '@/features/all-tasks/consts/issue-status.consts';

const issueAssigneeSchema = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    avatarUrl: z.string().nullable(),
  })
  .nullable();

const issueSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  priority: z.string(),
  dueDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  status: z.enum(ISSUE_STATUSES),
  assignee: issueAssigneeSchema,
});

const engagementWorkerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  position: z.string().nullable(),
  status: z.string(),
});

const responsibleUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  isAbsent: z.boolean(),
});

const engagementSchema = z.object({
  id: z.string(),
  type: z.string(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  worker: engagementWorkerSchema,
  responsibleUser: responsibleUserSchema,
  issues: z.array(issueSchema),
});

export const employeeWorkerSchema = z.array(engagementSchema);

export type IssueData = z.infer<typeof issueSchema>;
export type EngagementWorker = z.infer<typeof engagementWorkerSchema>;
export type ResponsibleUserData = z.infer<typeof responsibleUserSchema>;
export type WorkerEngagement = z.infer<typeof engagementSchema>;

export const sendReminderSchema = z.object({
  email: z.email({ message: 'Ungültige Email Adresse' }),
  subject: z
    .string({ message: 'Füge ein Betreff hinzu' })
    .min(1, { message: 'Füge ein Betreff hinzu' }),
  test: z.string(),
});
