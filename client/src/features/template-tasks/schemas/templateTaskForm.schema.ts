import { ISSUE_STATUSES } from '@/features/all-tasks/consts/issue-status.consts';
import {
  INTEGRATION_NONE,
  INTEGRATION_PROVIDERS,
  INTEGRATION_SEQUENCES,
} from '@/features/settings/integrations/integration.consts';
import z from 'zod';

export const templateTaskFormSchema = z
  .object({
    taskId: z.string(),
    taskName: z
      .string()
      .trim()
      .min(1, { message: 'Bitte gib einen Namen ein' }),
    taskDescription: z.string(),
    defaultStatus: z.enum(ISSUE_STATUSES, {
      message: 'Bitte wähle einen Status aus',
    }),
    defaultAssigneeUserId: z.string(),
    orderIndex: z.number(),
    integrationProvider: z.enum([
      INTEGRATION_NONE,
      ...INTEGRATION_PROVIDERS.map((item) => item.value),
    ]),
    sequence: z.enum([
      INTEGRATION_NONE,
      ...INTEGRATION_SEQUENCES.map((item) => item.value),
    ]),
    mailTemplateId: z.string(),
  })
  .superRefine((value, context) => {
    if (value.integrationProvider === INTEGRATION_NONE) {
      if (value.sequence !== INTEGRATION_NONE) {
        context.addIssue({
          code: 'custom',
          path: ['sequence'],
          message: 'Bitte wähle zuerst eine Integration',
        });
      }
      return;
    }
    if (value.sequence === INTEGRATION_NONE) {
      context.addIssue({
        code: 'custom',
        path: ['sequence'],
        message: 'Bitte wähle eine Sequenz',
      });
      return;
    }
    const sequence = INTEGRATION_SEQUENCES.find(
      (item) => item.value === value.sequence
    );
    if (sequence?.provider !== value.integrationProvider) {
      context.addIssue({
        code: 'custom',
        path: ['sequence'],
        message: 'Die Sequenz gehört nicht zu dieser Integration',
      });
    }
    if (
      (value.sequence === 'microsoft_send_email' ||
        value.sequence === 'microsoft_send_teams_message') &&
      value.mailTemplateId.trim().length === 0
    ) {
      context.addIssue({
        code: 'custom',
        path: ['mailTemplateId'],
        message: 'Bitte wähle eine E-Mail-Vorlage',
      });
    }
  });

export type TemplateTaskFormSchema = z.infer<typeof templateTaskFormSchema>;

export const EMPTY_TEMPLATE_TASK: TemplateTaskFormSchema = {
  taskId: '',
  taskName: '',
  taskDescription: '',
  defaultStatus: 'open',
  defaultAssigneeUserId: '',
  orderIndex: 0,
  integrationProvider: INTEGRATION_NONE,
  sequence: INTEGRATION_NONE,
  mailTemplateId: '',
};
