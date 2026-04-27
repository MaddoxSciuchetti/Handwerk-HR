import z from 'zod';

const germanDatePattern = /^\d{2}\.\d{2}\.\d{4}$/;

const workerDateSchema = z
  .string()
  .regex(germanDatePattern, 'Format: DD.MM.YYYY')
  .refine((value) => {
    const [day, month, year] = value.split('.').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }, 'Ungültiges Datum')
  .transform((value) => {
    const [day, month, year] = value.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString();
  })
  .pipe(z.string().datetime());

export const addWorkerBaseSchema = z.object({
  vorname: z.string().min(1, 'erforderlich'),
  nachname: z.string().min(1, 'erforderlich'),
  email: z
    .string()
    .min(1, 'erforderlich')
    .email('Ungültige email')
    .toLowerCase(),
  geburtsdatum: workerDateSchema,
  adresse: z.string().min(1, 'erforderlich'),
  eintrittsdatum: workerDateSchema,
  position: z.string().min(1, 'Position erforderlich'),
  // Optional: when set, every template item becomes a task on the new worker.
  templateId: z.string().uuid().optional(),
});

export const OnboardingValidation = addWorkerBaseSchema.extend({
  type: z.literal('Onboarding'),
});

export const OffboardingValidation = addWorkerBaseSchema.extend({
  type: z.literal('Offboarding'),
  austrittsdatum: workerDateSchema,
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
