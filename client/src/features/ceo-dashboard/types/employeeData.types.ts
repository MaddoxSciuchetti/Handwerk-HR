import { TEmployeeForm } from './employeeform.types';

export type TAccordion = {
  data: TEmployeeForm;
  onTaskClick: () => void;
  user: string;
  cleanData: Array<[string, TEmployeeForm]>;
};

export type EmployeeGroup = {
  employee: { vorname: string; nachname: string; email: string | null };
  inputs: Array<{
    description: string;
    timestamp: Date;
    form_field_id: number;
    status: string;
  }>;
};
