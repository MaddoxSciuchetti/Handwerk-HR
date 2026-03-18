export const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('de-DE');
};
