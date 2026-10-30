import { format, parseISO } from 'date-fns';

export function isDeactivation(sequence: string | null | undefined) {
  return (
    sequence === 'crewmeister_deactivate_account' ||
    sequence === 'microsoft_deactivate_account'
  );
}
export function scheduleDateLabel(value: string) {
  return format(parseISO(value.slice(0, 10)), 'dd.MM.yyyy');
}
