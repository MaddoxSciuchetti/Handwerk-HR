import z from 'zod';
import { ISSUE_STATUSES } from '../consts/issue-status.consts';
import {
  ARBEITSZEUGNIS,
  O365_BLOCK_SIGN_IN,
  TASK_AUTOMATION_NONE,
  TEAM_DEPARTURE_MAIL,
} from '../consts/task-automation.consts';

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Bitte gib einen Titel ein' }),
  workerEngagementId: z
    .string()
    .min(1, { message: 'Bitte wähle einen Handwerker aus' }),
  assigneeUserId: z
    .string()
    .min(1, { message: 'Bitte wähle eine Zuständigkeit aus' }),
  status: z.enum(ISSUE_STATUSES, {
    message: 'Bitte wähle einen Status aus',
  }),
  automation: z.enum([
    TASK_AUTOMATION_NONE,
    O365_BLOCK_SIGN_IN,
    TEAM_DEPARTURE_MAIL,
    ARBEITSZEUGNIS,
  ]),
});

export type TaskFormSchema = z.infer<typeof taskFormSchema>;
