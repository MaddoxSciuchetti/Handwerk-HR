import z from 'zod';

const emailSchema = z
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

export const registerSchema = loginSchema
  .extend({
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
