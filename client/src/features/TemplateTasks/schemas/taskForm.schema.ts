import z from 'zod';

const baseSchema = z.object({
  description: z
    .string()
    .min(6, { message: 'Bitte füge eine Längere Beschreibung hinzu' }),
  template_type: z.enum(['ONBOARDING', 'OFFBOARDING']),
  owner: z.string({ message: 'Bitte wählen ein Mitarbeiter aus' }),
});

export const addSchema = baseSchema;

export const editSchema = baseSchema.extend({
  form_field_id: z.number(),
});
