import { DateValidation } from '@/schemas/schema';
import z from 'zod';
import { VALIDATION_MESSAGES } from '../consts/validationMessages';

export const substituteSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export const absenceRecordSchema = z.object({
  id: z.string(),
  absenceType: z.enum([
    'SICK',
    'VACATION',
    'PARENTAL_LEAVE',
    'UNPAID',
    'OTHER',
  ]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  substitute: substituteSchema.nullable(),
});

export const organizationMemberSchema = z.object({
  role: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

export const OrgUsersSchema = z.array(
  z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    displayName: z.string().nullable(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    isEmailVerified: z.boolean(),
    isAbsent: z.boolean(),
    status: z.enum(['active', 'inactive', 'suspended']),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    organizationMembers: z.array(organizationMemberSchema),
    absences: z.array(absenceRecordSchema),
  })
);

export const employeeWorkerSchema = z.array(
  z.object({
    id: z.string(),
    type: z.enum(['onboarding', 'offboarding', 'transfer']),
    startDate: z.coerce.date().nullable(),
    endDate: z.coerce.date().nullable(),
    completedAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    engagementStatus: z.object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
    }),
    worker: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      position: z.string().nullable(),
      status: z.enum(['active', 'inactive', 'archived']),
    }),
    responsibleUser: z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
      avatarUrl: z.string().nullable(),
      isAbsent: z.boolean(),
      absences: z.array(absenceRecordSchema),
    }),
    issues: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        priority: z.enum(['urgent', 'high', 'medium', 'low', 'no_priority']),
        dueDate: z.coerce.date().nullable(),
        createdAt: z.coerce.date(),
        updatedAt: z.coerce.date(),
        issueStatus: z.object({
          id: z.string(),
          name: z.string(),
          color: z.string().nullable(),
        }),
        assignee: z
          .object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            avatarUrl: z.string().nullable(),
          })
          .nullable(),
        auditLogs: z.array(
          z.object({
            createdAt: z.coerce.date(),
            actorUser: z.object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
            }),
          })
        ),
      })
    ),
  })
);

export const absenceSchema = z.object({
  userId: z.string(),
  absenceType: z.enum(
    ['SICK', 'VACATION', 'PARENTAL_LEAVE', 'UNPAID', 'OTHER'],
    { message: VALIDATION_MESSAGES.required('Art der Abwesenheit') }
  ),
  startDate: DateValidation,
  endDate: DateValidation,
  substituteId: z
    .string({
      message: VALIDATION_MESSAGES.optionRequired,
    })
    .optional(),
});
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

export type CreateWorker = z.infer<typeof createWorkerSchema>;

// employee list
export type OrgUsersArray = z.infer<typeof OrgUsersSchema>;
export type OrgUsersObject = z.infer<typeof OrgUsersSchema>[number];

// employee worker data
export type EmployeeWorkerArray = z.infer<typeof employeeWorkerSchema>;
export type EmployeeWorkerItem = z.infer<typeof employeeWorkerSchema>[number];
export type EngagementIssue = EmployeeWorkerItem['issues'][number];

// absence
export type AbsenceRecord = z.infer<typeof absenceRecordSchema>;
export type AbsenceFormData = z.infer<typeof absenceSchema>;
