import z from 'zod';

export const dateSchema = z
  .string()
  .min(1, { message: 'Falsches Format' })
  .regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Format: DD.MM.YYYY')
  .refine((date) => {
    const [day, month, year] = date.split('.').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return (
      dateObj.getDate() === day &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getFullYear() === year
    );
  }, 'Ungültiges Datum');
