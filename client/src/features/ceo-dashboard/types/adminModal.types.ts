import z from 'zod';
import { SendReminderSchema } from '../schemas/employeeform.schemas';

export type TCloseModal = {
  onClose?: () => void;
  selectedUser?: string | null;
};

export type TSendReminderSchema = z.infer<typeof SendReminderSchema>;
