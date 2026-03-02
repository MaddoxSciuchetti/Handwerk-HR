import { EmployeeWorker } from './employeeform.types';

export type TAccordion = {
  data: EmployeeWorker;
  onTaskClick: () => void;
  user: string;
  cleanData: Array<[string, EmployeeWorker]>;
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
