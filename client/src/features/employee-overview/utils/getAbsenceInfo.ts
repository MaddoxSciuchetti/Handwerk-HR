import { EmployeeInfoResponse } from '@/types/api.types';
import { calculateData, dateObject } from './calculateDate.utils';

export const getAbsenceInfo = (e: EmployeeInfoResponse) => {
  const absence = e.absences?.[0];
  if (!absence) return null;

  const isCurrent = calculateData(
    new Date(absence.startDate),
    new Date(absence.endDate),
    dateObject
  );
  return isCurrent ? absence : null;
};
