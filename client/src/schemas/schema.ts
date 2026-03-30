import z from 'zod';

const germanDatePattern = /^\d{2}\.\d{2}\.\d{4}$/;

export const DateValidation = z
  .string()
  .regex(germanDatePattern, 'Format: DD.MM.YYYY')
  .refine((value) => {
    const [day, month, year] = value.split('.').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    );
  }, 'Ungültiges Datum')
  .transform((value) => {
    const [day, month, year] = value.split('.').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString();
  })
  .pipe(z.string().datetime());
