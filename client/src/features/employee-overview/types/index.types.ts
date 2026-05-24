export type MitarbeiterInput = {
  name: string;
  placeholder: string;
  type: string;
  required: boolean;
};

export type MitarbeiterInputs = MitarbeiterInput[];

export type AbsenceType =
  | 'SICK'
  | 'VACATION'
  | 'PARENTAL_LEAVE'
  | 'UNPAID'
  | 'OTHER';

export type AbsenceData = {
  userId: string;
  absenceType: AbsenceType;
  startDate: string;
  endDate: string;
  substituteId: string;
};

export type EmployeeInfoItem = {
  label: string;
  value: string;
};
