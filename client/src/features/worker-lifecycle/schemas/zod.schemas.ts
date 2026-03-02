import z from 'zod';
import { dateSchema } from '../../../schemas/schema';

export const addWorkerBaseSchema = z.object({
  vorname: z.string().min(1, 'erforderlich'),
  nachname: z.string().min(1, 'erforderlich'),
  email: z
    .string()
    .min(1, 'erforderlich')
    .email('Ungültige email')
    .toLowerCase(),
  geburtsdatum: dateSchema,
  adresse: z.string().min(1, 'erforderlich'),
  eintrittsdatum: dateSchema,
  position: z.string().min(1, 'Position erforderlich'),
});

export const OnboardingValidation = addWorkerBaseSchema.extend({
  type: z.literal('Onboarding'),
});

export const OffboardingValidation = addWorkerBaseSchema.extend({
  type: z.literal('Offboarding'),
  austrittsdatum: z.string().min(1, 'erforderlich'),
});

export const addWorkerSchema = z.discriminatedUnion('type', [
  OnboardingValidation,
  OffboardingValidation,
]);

export type AddWorker = z.infer<typeof addWorkerSchema>;

export const formDescriptionSchema = z.object({
  form_field_id: z.coerce.number(),
  description: z.string(),
  owner: z.string(),
});
