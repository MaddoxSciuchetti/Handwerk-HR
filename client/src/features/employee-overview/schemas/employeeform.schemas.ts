import z from 'zod';

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
      absences: z.array(
        z.object({
          absenceType: z.enum([
            'SICK',
            'VACATION',
            'PARENTAL_LEAVE',
            'UNPAID',
            'OTHER',
          ]),
          startDate: z.coerce.date(),
          endDate: z.coerce.date(),
          substitute: z
            .object({
              id: z.string(),
              firstName: z.string(),
              lastName: z.string(),
            })
            .nullable(),
        })
      ),
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

export const sendReminderSchema = z.object({
  email: z.email({ message: 'Ungültige Email Adresse' }),
  subject: z
    .string({ message: 'Füge ein Betreff hinzu' })
    .min(1, { message: 'Füge ein Betreff hinzu' }),
  test: z.string(),
});
