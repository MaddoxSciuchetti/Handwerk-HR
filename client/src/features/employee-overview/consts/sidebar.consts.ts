export type EmployeeSidebarAction = 'info' | 'absence' | 'tasks';

export type EmployeeSidebarOption = {
  id: string;
  value: EmployeeSidebarAction;
  title: string;
  description: string;
};

export const EMPLOYEE_SIDEBAR_OPTIONS: EmployeeSidebarOption[] = [
  {
    id: 'employee-action-info',
    value: 'info',
    title: 'Informationen',
    description: 'Sieh dir die wichtigsten Daten dieses Mitarbeiters an',
  },
  {
    id: 'employee-action-absence',
    value: 'absence',
    title: 'Abwesenheit eintragen',
    description: 'Erfasse eine Abwesenheit und wähle eine Vertretung',
  },
  {
    id: 'employee-action-tasks',
    value: 'tasks',
    title: 'Aufgaben ansehen',
    description: 'Sieh dir die offenen Aufgaben des Mitarbeiters an',
  },
];

export const EMPLOYEE_SIDEBAR_TITLES: Record<EmployeeSidebarAction, string> = {
  info: 'Mitarbeiter Informationen',
  absence: 'Abwesenheit eintragen',
  tasks: 'Aufgaben',
};
