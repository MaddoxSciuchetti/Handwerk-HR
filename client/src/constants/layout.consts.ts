import { FileText, Inbox, ListCheck, Ticket, UserRound } from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
  },
  {
    title: 'Aufgaben',
    to: '/tasks',
    icon: Ticket,
  },
];

export const SETTINGSITEMS = [
  {
    title: 'Profil',
    to: '/settings/profile',
    icon: UserRound,
  },

  {
    title: 'Mitarbeiter',
    to: '/settings/employees',
    icon: UserRound,
  },
  {
    title: 'Aufgaben',
    to: '/settings/issue-statuses',
    icon: ListCheck,
  },
  {
    title: 'Handwerker',
    to: '/settings/engagement-statuses',
    icon: Inbox,
  },
  {
    title: 'Templates',
    to: '/settings/templates/template',
    icon: FileText,
  },
];
