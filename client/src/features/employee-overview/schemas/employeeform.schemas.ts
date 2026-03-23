import z from 'zod';

export const employeeWorkerSchema = z.array(
  z.object({
    form_field_id: z.coerce.number(),
    description: z.coerce.string(),
    owner: z.string(),
    ownerName: z.string(),
    isSubstitute: z.boolean(),
    substituteName: z.string().nullable(),
    inputs: z.array(
      z.object({
        id: z.coerce.number(),
        status: z.coerce.string(),
        timestamp: z.coerce.date(),
        lastChangedAt: z.coerce.date(),
        employee: z.object({
          id: z.number(),
          vorname: z.string(),
          nachname: z.string(),
          email: z.string().nullable(),
        }),
      })
    ),
  })
);

export const sendReminderSchema = z.object({
  email: z.email({ message: 'Ungültige Email Adresse' }),
  subject: z
    .string({ message: 'Füge ein Betreff hinzu' })
    .min(1, { message: 'Füge ein Betreff hinzu' }),
  test: z.string(),
});
