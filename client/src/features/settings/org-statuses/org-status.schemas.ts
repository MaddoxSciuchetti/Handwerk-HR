import { z } from 'zod';

/** Matches server org status name rules (trim, 1–120 chars). */
export const createOrgStatusNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name ist erforderlich' })
    .max(120, { message: 'Maximal 120 Zeichen' }),
});

export const updateOrgStatusNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name ist erforderlich' })
    .max(120, { message: 'Maximal 120 Zeichen' }),
});
