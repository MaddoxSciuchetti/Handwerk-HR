import z from 'zod';

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Bitte gib einen Titel ein' }),
  workerEngagementId: z
    .string()
    .min(1, { message: 'Bitte wähle einen Handwerker aus' }),
  assigneeUserId: z
    .string()
    .min(1, { message: 'Bitte wähle eine Zuständigkeit aus' }),
  statusId: z.string().min(1, { message: 'Bitte wähle einen Status aus' }),
});

export type TaskFormSchema = z.infer<typeof taskFormSchema>;
