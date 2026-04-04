import { EmployeeInfoResponse } from '@/types/api.types';

export const getAbsenceInfo = (e: EmployeeInfoResponse) => {
  if (!e.isAbsent || e.absences.length === 0) return null;
  return e.absences[0];
};
