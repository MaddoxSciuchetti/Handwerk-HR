import {
  CreditCard,
  FileText,
  Inbox,
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
    title: 'Handwerker',
    to: '/settings/engagement-statuses',
    icon: Inbox,
  },
  {
    title: 'Templates',
    to: '/settings/templates/template',
    icon: FileText,
  },
  {
    title: 'Zahlungen',
    to: '/settings/payments',
    icon: CreditCard,
  },
];
