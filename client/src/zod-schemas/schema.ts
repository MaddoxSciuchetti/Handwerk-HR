import z from 'zod';

export const DateSchema = z
  .string()
  .min(1, { message: 'Falsches Format' })
  .regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Format: DD.MM.YYYY')
  .refine((date) => {
    const [day, month, year] = date.split('.').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getDate() === day &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getFullYear() === year
    );
  }, 'Ungültiges Datum');

export const SubUser = z.object({
  id: z.coerce.string(),
  vorname: z.string(),
  nachname: z.string(),
});

export const EmployeeStatus = z.array(
  z.object({
    id: z.coerce.string(),
    userId: z.coerce.string(),
    absence: z.coerce.string(),
    absencetype: z.coerce.string().nullable(),
    absencebegin: z.coerce.date().nullable(),
    absenceEnd: z.coerce.date().nullable(),
    substitute: z.coerce.string().nullable(),
    sub_user: SubUser.nullable(),
  })
);

export const ZEmployeeData = z.array(
  z.object({
    id: z.coerce.string(),
    vorname: z.string(),
    nachname: z.string(),
    email: z.string().nullable(),
    verified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    user_permission: z.enum(['CHEF', 'MITARBEITER']),
    employeeStatus: EmployeeStatus.nullable(),
  })
);

export type TEmployeeResponse = z.infer<typeof ZEmployeeData>;
export type TEmployee = z.infer<typeof ZEmployeeData.element>;

export const ZDescriptionData = z.array(
  z.object({
    form_field_id: z.coerce.number(),
    description: z.string(),
    owner: z.string(),
  })
);
