import {
  ClipboardList,
  CreditCard,
  FileText,
  Inbox,
  Mail,
  ScrollText,
  Shirt,
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
  {
    title: 'Bestand',
    to: '/bestand',
    icon: Shirt,
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
    title: 'Fragebogen',
    to: '/settings/questionnaire',
    icon: ClipboardList,
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
