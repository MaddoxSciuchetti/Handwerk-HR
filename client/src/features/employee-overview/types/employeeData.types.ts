import useEmployeeGroups from '../hooks/useEmployeeGroups';
import { EmployeeWorker } from './employeeform.types';

export type TAccordion = {
  onTaskClick: () => void;
  user: string;
  tasksByEmployee: Array<[string, EmployeeWorker]>;
};

export type EmployeeOpenTasks = {
  employee: { vorname: string; nachname: string; email: string | null };
  inputs: Array<{
    description: string;
    timestamp: Date;
    lastChangedAt: Date;
    form_field_id: number;
    status: string;
  }>;
};

export type EmployeeGroup = ReturnType<
  typeof useEmployeeGroups
>['employeeGroups'][number][1];
