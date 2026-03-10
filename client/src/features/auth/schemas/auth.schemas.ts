import z from 'zod';

const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email must be at most 255 characters' });

const passwordSchema = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(6, { message: 'Password must be at least 6 characters' })
  .max(255, { message: 'Password must be at most 255 characters' });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirm password is required' })
      .min(6, { message: 'Confirm password must be at least 6 characters' })
      .max(255, { message: 'Confirm password must be at most 255 characters' }),
    firstName: z
      .string()
      .min(1, { message: 'First name is required' })
      .max(255, { message: 'First name must be at most 255 characters' }),
    lastName: z
      .string()
      .min(1, { message: 'Last name is required' })
      .max(255, { message: 'Last name must be at most 255 characters' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password and confirm password must match',
    path: ['confirmPassword'],
  });

export type LoginFormValues = Omit<z.infer<typeof loginSchema>, 'userAgent'>;
export type RegisterFormValues = Omit<
  z.infer<typeof registerSchema>,
  'userAgent'
>;
