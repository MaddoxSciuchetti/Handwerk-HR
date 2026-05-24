import { formatDate } from '@/features/worker-lifecycle/utils/dateCalculation';
import { EmployeeInfoResponse } from '@/types/api.types';
import { EmployeeInfoItem } from '../types/index.types';
import { getAbsenceInfo } from '../utils/getAbsenceInfo';

export const employeeInfos = (e: EmployeeInfoResponse): EmployeeInfoItem[] => {
  const absence = getAbsenceInfo(e);
  const membershipRole = e.organizationMembers[0]?.membershipRole;

  return [
    { label: 'Vorname', value: e.firstName },
    { label: 'Nachname', value: e.lastName },
    { label: 'E-Mail', value: e.email },
    {
      label: 'Aktueller Status',
      value: e.isAbsent ? 'Abwesend' : 'Anwesend',
    },
    { label: 'Abwesenheitsart', value: absence?.absenceType ?? '—' },
    {
      label: 'Abwesend von bis',
      value: absence
        ? `${formatDate(absence.startDate)} - ${formatDate(absence.endDate)}`
        : '—',
    },
    {
      label: 'Vertretung',
      value: absence?.substitute
        ? `${absence.substitute.firstName} ${absence.substitute.lastName}`
        : '—',
    },
    {
      label: 'Rolle',
      value: membershipRole === 'admin' ? 'Administrator' : 'Mitarbeiter',
    },
    { label: 'Erstellt', value: formatDate(e.createdAt) },
    { label: 'Verifiziert', value: e.isVerified ? 'Ja' : 'Nein' },
  ];
};
