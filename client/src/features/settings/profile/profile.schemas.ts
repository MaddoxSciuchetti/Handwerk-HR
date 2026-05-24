import { emailSchema } from '@/features/auth/schemas/auth.schemas';
import { z } from 'zod';

const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Muss mindestens 2 Zeichen haben' })
  .max(255, { message: 'Darf maximal 255 Zeichen haben' });

export const profileUpdateSchema = z.object({
  displayName: nameSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
