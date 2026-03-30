import { DateValidation } from '@/schemas/schema';
import z from 'zod';

export const baseWorkerSchema = z.object({
  firstName: z.string().min(1, 'erforderlich'),
  lastName: z.string().min(1, 'erforderlich'),
  email: z
    .string()
    .min(1, 'erforderlich')
    .email('Ungültige email')
    .toLowerCase(),
  birthday: DateValidation,
  street: z.string().min(1, 'erforderlich'),
  entryDate: DateValidation,
  position: z.string().min(1, 'Position erforderlich'),
});

export const onboardingWorkerSchema = baseWorkerSchema.extend({
  type: z.literal('Onboarding'),
});

export const offboardingWorkerSchema = baseWorkerSchema.extend({
  type: z.literal('Offboarding'),
  exitDate: DateValidation,
});

export const createWorkerSchema = z.discriminatedUnion('type', [
  onboardingWorkerSchema,
  offboardingWorkerSchema,
]);

export type CreateWorker = z.infer<typeof createWorkerSchema>;

export const formDescriptionSchema = z.object({
  form_field_id: z.coerce.number(),
  description: z.string(),
  owner: z.string(),
});
