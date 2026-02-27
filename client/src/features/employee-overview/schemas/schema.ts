import { DateSchema } from '@/zod-schemas/schema';
import z from 'zod';

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

export const CreateWorkerSchema = z
  .object({
    firstName: z.string().min(3, { message: 'Vorname ist erforderlich' }),
    lastName: z.string().min(3, { message: 'Nachname ist erforderlich' }),
    email: z
      .string()
      .min(3, { message: 'Bitte gebe eine email an' })
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        message: 'Die Email ist falsch',
      }),
    password: z.string().min(6, { message: 'Bitte gebe ein Passwort ein' }),
    confirmPassword: z
      .string()
      .min(6, { message: 'Bitte gebe ein Passwort ein' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
  });

export const AbsenceSchema = z.object({
  id: z.string(),
  absence: z.string().optional(),
  absencetype: z
    .string({ message: 'Art der Abwesenheit ist erforderlich' })
    .min(1, { message: 'Art der Abwesenheit ist erforderlich' }),
  absencebegin: DateSchema,
  absenceEnd: DateSchema,
  substitute: z.string({ message: 'Bitte wähle von der Option' }),
});

export type TWorkerSchema = z.infer<typeof CreateWorkerSchema>;

export type TEmployeeResponse = z.infer<typeof ZEmployeeData>;
export type TEmployee = z.infer<typeof ZEmployeeData.element>;
