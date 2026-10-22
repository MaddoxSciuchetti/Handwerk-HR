import z from 'zod';
import { ISSUE_STATUSES } from '../consts/issue-status.consts';
import {
  ARBEITSZEUGNIS,
  O365_BLOCK_SIGN_IN,
  TASK_AUTOMATION_NONE,
  TEAM_DEPARTURE_MAIL,
} from '../consts/task-automation.consts';

export const taskFormSchema = z
  .object({
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
    sequence: z.string(),
    mailTemplateId: z.string(),
    mailSenderAddress: z.string(),
    microsoftAccountId: z.string().trim().optional(),
    automation: z.enum([
      TASK_AUTOMATION_NONE,
      O365_BLOCK_SIGN_IN,
      TEAM_DEPARTURE_MAIL,
      ARBEITSZEUGNIS,
    ]),
  })
  .superRefine((data, ctx) => {
    if (
      data.sequence === 'microsoft_deactivate_account' &&
      data.microsoftAccountId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        data.microsoftAccountId
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['microsoftAccountId'],
        message: 'Bitte gib eine gültige Microsoft-Konto-ID ein',
      });
    }

    if ((data.sequence === 'microsoft_send_email' || data.sequence === 'microsoft_send_teams_message') && !data.mailTemplateId) {
      ctx.addIssue({
        code: 'custom',
        path: ['mailTemplateId'],
        message: 'Bitte wähle eine E-Mail-Vorlage',
      });
    }
    if (
      data.sequence === 'microsoft_send_email' &&
      !data.mailSenderAddress.trim()
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['mailSenderAddress'],
        message: 'Bitte wähle einen Absender',
      });
    }
  });

export type TaskFormSchema = z.infer<typeof taskFormSchema>;
