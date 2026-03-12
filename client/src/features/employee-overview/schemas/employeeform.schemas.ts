import z from 'zod';

export const employeeWorkerSchema = z.array(
  z.object({
    description: z.coerce.string(),
    form_field_id: z.coerce.number(),
    owner: z.string(),
    fullname: z.string(),
    auth_id: z.string(),
    is_substitute: z.boolean(),
    substitute_id: z.string().nullable(),
    original_owner: z.string(),
    substitute_name: z.string().nullable(),
    inputs: z.array(
      z.object({
        id: z.coerce.number(),
        employee_form_id: z.coerce.number(),
        form_field_id: z.coerce.number(),
        status: z.coerce.string(),
        timestamp: z.coerce.date(),
        timeStampLastChange: z.coerce.date(),
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
