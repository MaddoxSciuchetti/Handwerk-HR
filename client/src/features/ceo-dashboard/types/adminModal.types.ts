import z from 'zod';
import { sendReminderSchema } from '../schemas/employeeform.schemas';

export type TCloseModal = {
  onClose?: () => void;
  selectedUser?: string | null;
};

export type TSendReminderSchema = z.infer<typeof sendReminderSchema>;
