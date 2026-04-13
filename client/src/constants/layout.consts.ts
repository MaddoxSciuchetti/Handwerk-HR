import {
  Building,
  FileText,
  Folder,
  Inbox,
  ListCheck,
  Ticket,
  UserRound,
} from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
  },
  {
    title: 'Aufgaben',
    to: '/template',
    icon: Ticket,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Mitarbeiter',
    to: '/employee-overview',
    icon: UserRound,
  },
];

export const SETTINGSITEMS = [
  {
    title: 'Unternehmen',
    to: '/settings/company',
    icon: Building,
  },
  {
    title: 'Mitarbeiter',
    to: '/settings/employees',
    icon: UserRound,
  },
  {
    title: 'Aufgaben',
    to: '/task-settings',
    icon: ListCheck,
  },
  {
    title: 'Projekte',
    to: '/project-settings',
    icon: Folder,
  },
  {
    title: 'Templates',
    to: '/template-settings',
    icon: FileText,
  },
];
