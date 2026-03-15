import z from 'zod';

export const featureSchema = z.object({
  importance: z.enum(['Niedrig', 'Mittel', 'Hoch', 'Sehr wichtig']),
  textarea: z.string().trim().min(5, 'Bitte mindestens 5 Zeichen eingeben.'),
  file: z.array(z.custom<File>()).optional(),
});

export type TFeatureForm = z.infer<typeof featureSchema>;
