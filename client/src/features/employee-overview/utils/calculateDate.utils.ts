export const dateObject = new Date(Date.now());
export const calculateData = (
  firstDate: Date,
  secondDate: Date,
  dateObject: Date
) => {
  if (firstDate && secondDate <= dateObject) {
    return false;
  } else {
    return true;
  }
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('de-DE');
};
