import z from 'zod';
import { sendReminderSchema } from '../schemas/employeeform.schemas';

export type TCloseModal = {
  onClose?: () => void;
  selectedUser?: string | null;
};

export type SendReminder = z.infer<typeof sendReminderSchema>;
