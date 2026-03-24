import { formatDate } from '@/features/worker-lifecycle/utils/dateCalculation';
import { EmployeeInfoResponse } from '@/types/api.types';
import { EmployeeInfoItem } from '../types/index.types';
import { getAbsenceInfo } from '../utils/getAbsenceInfo';

export const employeeInfos = (e: EmployeeInfoResponse): EmployeeInfoItem[] => {
  const absence = getAbsenceInfo(e);
  return [
    { label: 'Vorname', value: e.vorname },
    { label: 'Nachname', value: e.nachname },
    { label: 'E-Mail', value: e.email },
    {
      label: 'Aktueller Status',
      value: absence?.substitute ? 'Abwesend' : 'Anwesend',
    },
    { label: 'Abwesenheitsart', value: absence?.absencetype ?? '—' },
    {
      label: 'Abwesend von bis',
      value: absence?.substitute
        ? `${formatDate(absence.absencebegin)} - ${formatDate(absence.absenceEnd)}`
        : '—',
    },
    {
      label: 'Vertretung',
      value: absence?.sub_user
        ? `${absence.sub_user.vorname} ${absence.sub_user.nachname}`
        : '—',
    },
    {
      label: 'Rolle',
      value: e.user_permission === 'CHEF' ? 'Administrator' : 'Mitarbeiter',
    },
    { label: 'Erstellt', value: formatDate(e.createdAt) },
    { label: 'Verifiziert', value: e.verified ? 'Ja' : 'Nein' },
  ];
};
