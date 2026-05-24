import { ISSUE_STATUSES } from '@/features/all-tasks/consts/issue-status.consts';
import z from 'zod';

export const templateTaskFormSchema = z.object({
  taskId: z.string(),
  taskName: z
    .string()
    .trim()
    .min(1, { message: 'Bitte gib einen Namen ein' }),
  taskDescription: z.string(),
  defaultStatus: z.enum(ISSUE_STATUSES, {
    message: 'Bitte wähle einen Status aus',
  }),
  defaultAssigneeUserId: z
    .string()
    .min(1, { message: 'Bitte wähle einen Verantwortlichen aus' }),
  orderIndex: z.number(),
});

export type TemplateTaskFormSchema = z.infer<typeof templateTaskFormSchema>;

export const EMPTY_TEMPLATE_TASK: TemplateTaskFormSchema = {
  taskId: '',
  taskName: '',
  taskDescription: '',
  defaultStatus: 'open',
  defaultAssigneeUserId: '',
  orderIndex: 0,
};
