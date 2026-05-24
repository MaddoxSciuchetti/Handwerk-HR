import { AbsenceType } from '../types/index.types';

export const absenceReason: Array<{ label: string; value: AbsenceType }> = [
  { label: 'Krank', value: 'SICK' },
  { label: 'Urlaub', value: 'VACATION' },
  { label: 'Elternzeit', value: 'PARENTAL_LEAVE' },
  { label: 'Unbezahlt', value: 'UNPAID' },
  { label: 'Andere', value: 'OTHER' },
];
