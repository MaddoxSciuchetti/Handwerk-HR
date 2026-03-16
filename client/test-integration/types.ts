export type EmployeeStatusRecord = {
  id: string;
  userId: string;
  absence: string;
  absencetype: string | null;
  absencebegin: string | null;
  absenceEnd: string | null;
  substitute: string | null;
  sub_user: {
    id: string;
    vorname: string;
    nachname: string;
  } | null;
};

export type EmployeeRecord = {
  id: string;
  vorname: string;
  nachname: string;
  email: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  user_permission: 'CHEF' | 'MITARBEITER';
  employeeStatus: EmployeeStatusRecord[];
};
