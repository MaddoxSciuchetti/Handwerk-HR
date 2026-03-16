import { dateSchema } from '@/schemas/schema';
import z from 'zod';
import { VALIDATION_MESSAGES } from '../consts/validationMessages';

export const subUserSchema = z.object({
  id: z.coerce.string(),
  vorname: z.string(),
  nachname: z.string(),
});

export const employeeStatusSchema = z.array(
  z.object({
    id: z.coerce.string(),
    userId: z.coerce.string(),
    absence: z.coerce.string(),
    absencetype: z.coerce.string().nullable(),
    absencebegin: z.coerce.date().nullable(),
    absenceEnd: z.coerce.date().nullable(),
    substitute: z.coerce.string().nullable(),
    sub_user: subUserSchema.nullable(),
  })
);

export const employeeDataSchema = z.array(
  z.object({
    id: z.coerce.string(),
    vorname: z.string(),
    nachname: z.string(),
    email: z.string().nullable(),
    verified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    user_permission: z.enum(['CHEF', 'MITARBEITER']),
    employeeStatus: employeeStatusSchema.nullable(),
  })
);

export const createWorkerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, { message: VALIDATION_MESSAGES.required('Vorname') })
      .min(3, { message: VALIDATION_MESSAGES.minLength('Vorname', 3) }),
    lastName: z
      .string()
      .min(1, { message: VALIDATION_MESSAGES.required('Nachname') })
      .min(3, { message: VALIDATION_MESSAGES.minLength('Nachname', 3) }),
    email: z
      .string()
      .min(1, { message: VALIDATION_MESSAGES.required('E-Mail') })
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        message: VALIDATION_MESSAGES.invalidEmail,
      }),
    password: z
      .string()
      .trim()
      .min(1, { message: VALIDATION_MESSAGES.required('Passwort') })
      .min(6, { message: VALIDATION_MESSAGES.minLength('Passwort', 6) }),
    confirmPassword: z
      .string()
      .trim()
      .min(1, { message: VALIDATION_MESSAGES.required('Passwort bestätigen') })
      .min(6, {
        message: VALIDATION_MESSAGES.minLength('Passwort bestätigen', 6),
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.valuesMustMatch(
      'Passwort',
      'Passwort bestätigen'
    ),
  });

export const absenceSchema = z.object({
  id: z.string(),
  absence: z.string().optional(),
  absencetype: z
    .string({ message: VALIDATION_MESSAGES.required('Art der Abwesenheit') })
    .min(1, { message: VALIDATION_MESSAGES.required('Art der Abwesenheit') }),
  absencebegin: dateSchema,
  absenceEnd: dateSchema,
  substitute: z.string({ message: VALIDATION_MESSAGES.optionRequired }),
});

export type CreateWorker = z.infer<typeof createWorkerSchema>;

export type EmployeeDataArray = z.infer<typeof employeeDataSchema>;
export type EmployeeDataObject = z.infer<typeof employeeDataSchema.element>;
export type EmployeeStatusArray = z.infer<typeof employeeStatusSchema>;
export type EmployeeStatusObject = z.infer<typeof employeeStatusSchema.element>;
