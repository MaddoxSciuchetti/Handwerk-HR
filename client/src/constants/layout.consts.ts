import {
  CreditCard,
  FileText,
  Inbox,
  Mail,
  ScrollText,
  Ticket,
  UserRound,
  Zap,
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
    title: 'Templates',
    to: '/settings/templates/template',
    icon: FileText,
  },
  {
    title: 'Dokumente',
    to: '/settings/documents',
    icon: ScrollText,
  },
  {
    title: 'Automatisierung',
    to: '/settings/automation',
    icon: Zap,
  },
  {
    title: 'Willkommensmail',
    to: '/settings/welcome-mail',
    icon: Mail,
  },
  {
    title: 'Infomail Entlassung',
    to: '/settings/departure-mail',
    icon: Mail,
  },
  {
    title: 'Zahlungen',
    to: '/settings/payments',
    icon: CreditCard,
  },
];
