import { EmployeeInfoResponse } from '@/types/api.types';
import { calculateData, dateObject } from './calculateDate.utils';

export const getAbsenceInfo = (e: EmployeeInfoResponse) => {
  const status = e.employeeStatus?.[0];
  if (!status) return null;

  const isAbsent = calculateData(
    new Date(status.absencebegin || ''),
    new Date(status.absenceEnd || ''),
    dateObject
  );
  return isAbsent ? status : null;
};
