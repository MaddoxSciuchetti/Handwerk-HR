export type MitarbeiterInput = {
  name: string;
  placeholder: string;
  type: string;
  required: boolean;
};

export type MitarbeiterInputs = MitarbeiterInput[];

export type AbsenceData = {
  id: string;
  absence?: string;
  absencetype: string;
  absencebegin: string;
  absenceEnd: string;
  substitute: string;
};

export type EmployeeInfoItem = {
  label: string;
  value: string;
};
