import { EmployeeRecord, EmployeeStatusRecord } from './types';

export const nowIso = new Date().toISOString();

export const buildEmployee = (
  employeeStatus: EmployeeStatusRecord[] = []
): EmployeeRecord => ({
  id: 'emp-1',
  vorname: 'Max',
  nachname: 'Mustermann',
  email: 'max@example.com',
  verified: true,
  createdAt: nowIso,
  updatedAt: nowIso,
  user_permission: 'MITARBEITER',
  employeeStatus,
});

export const absentStatus: EmployeeStatusRecord = {
  id: 'status-1',
  userId: 'emp-1',
  absence: 'true',
  absencetype: 'krank',
  absencebegin: '2030-01-10T00:00:00.000Z',
  absenceEnd: '2030-01-15T00:00:00.000Z',
  substitute: 'emp-2',
  sub_user: {
    id: 'emp-2',
    vorname: 'Erika',
    nachname: 'Musterfrau',
  },
};
