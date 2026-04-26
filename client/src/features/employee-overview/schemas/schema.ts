import { dateSchema } from '@/schemas/schema';
import z from 'zod';
import { VALIDATION_MESSAGES } from '../consts/validationMessages';

export const substituteUserSchema = z.object({
  id: z.coerce.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const absenceItemSchema = z.object({
  id: z.coerce.string(),
  absenceType: z.string().nullable(),
  startDate: z.coerce.date().nullable(),
  endDate: z.coerce.date().nullable(),
  substitute: substituteUserSchema.nullable(),
});

export const orgMemberSchema = z.object({
  role: z.object({ name: z.string() }),
});

export const employeeDataSchema = z.array(
  z.object({
    id: z.coerce.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().nullable(),
    isEmailVerified: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    organizationMembers: z.array(orgMemberSchema),
    absences: z.array(absenceItemSchema),
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
export type AbsenceItem = z.infer<typeof absenceItemSchema>;
