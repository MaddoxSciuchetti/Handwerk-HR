import z from 'zod';

export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be at most 255 characters' });

const loginPasswordSchema = z
  .string()
  .trim()
  .min(1, { message: 'Password is required' })
  .max(255, { message: 'Password must be at most 255 characters' });

const registerPasswordSchema = loginPasswordSchema
  .min(6, { message: 'Password must be at least 6 characters' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least 1 uppercase letter (A-Z)',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least 1 lowercase letter (a-z)',
  })
  .regex(/\d/, { message: 'Password must contain at least 1 number (0-9)' })
  .regex(/[!@#$%^&*]/, {
    message: 'Password must contain at least 1 special character (!@#$%^&*)',
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  userAgent: z.string().optional(),
});

const registerBaseSchema = loginSchema.extend({
  password: registerPasswordSchema,
  confirmPassword: z
    .string()
    .trim()
    .min(1, { message: 'Confirm password is required' })
    .max(255, { message: 'Confirm password must be at most 255 characters' }),
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(255, { message: 'First name must be at most 255 characters' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(255, { message: 'Last name must be at most 255 characters' }),
  displayName: z
    .string()
    .trim()
    .min(1, { message: 'Display name is required' })
    .max(255, { message: 'Display name must be at most 255 characters' }),
});

export const registerSchema = registerBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Password and confirm password must match',
    path: ['confirmPassword'],
  }
);

const registerOrgBaseSchema = registerBaseSchema.extend({
  orgName: z
    .string()
    .min(1, { message: 'Company name is required' })
    .max(255, { message: 'Company name must be at most 255 characters' }),
  orgDescription: z
    .string()
    .max(1000, { message: 'Description must be at most 1000 characters' })
    .optional(),
  orgEmail: z
    .string()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Org email must be at most 255 characters' })
    .optional()
    .or(z.literal('')),
  orgPhoneNumber: z
    .string()
    .max(50, { message: 'Org phone number must be at most 50 characters' })
    .optional(),
  orgWebsiteUrl: z
    .string()
    .url({ message: 'Must be a valid URL' })
    .optional()
    .or(z.literal('')),
  orgCountry: z
    .string()
    .max(100, { message: 'Country must be at most 100 characters' })
    .optional(),
  orgIndustry: z
    .string()
    .max(100, { message: 'Industry must be at most 100 characters' })
    .optional(),
  orgSize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
});

export const registerOrgSchema = registerOrgBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Password and confirm password must match',
    path: ['confirmPassword'],
  }
);

const inviteAcceptBaseSchema = registerBaseSchema.pick({
  displayName: true,
  firstName: true,
  lastName: true,
  password: true,
  confirmPassword: true,
});

export const inviteAcceptSchema = inviteAcceptBaseSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Password and confirm password must match',
    path: ['confirmPassword'],
  }
);

export type LoginFormValues = Omit<z.infer<typeof loginSchema>, 'userAgent'>;
export type RegisterFormValues = Omit<
  z.infer<typeof registerSchema>,
  'userAgent'
>;
export type RegisterOrgFormValues = Omit<
  z.infer<typeof registerOrgSchema>,
  'userAgent'
>;
export type InviteAcceptFormValues = Omit<
  z.infer<typeof inviteAcceptSchema>,
  'userAgent'
>;
