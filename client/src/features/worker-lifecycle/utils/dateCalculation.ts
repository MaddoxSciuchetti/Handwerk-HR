/** ISO (API) → DD.MM.YYYY for display and inline editing; matches `DateValidation` in `@/schemas/schema`. */
export const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};
