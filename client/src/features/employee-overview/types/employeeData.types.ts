import useEmployeeGroups from '../hooks/useEmployeeGroups';
import { WorkerEngagement } from '../schemas/employeeform.schemas';

export type TAccordion = {
  onTaskClick: () => void;
  user: string;
  tasksByEmployee: Array<[string, WorkerEngagement[]]>;
};

export type EmployeeGroup = ReturnType<
  typeof useEmployeeGroups
>['employeeGroups'][number][1];
