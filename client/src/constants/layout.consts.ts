import {
  ClipboardList,
  CreditCard,
  FileText,
  Inbox,
  Plug,
  ScrollText,
  Shirt,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
  },
  {
    title: 'Team',
    to: '/team',
    icon: Users,
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
    title: 'Templates',
    to: '/settings/templates/template',
    icon: FileText,
    activePaths: [
      '/settings/welcome-mail',
      '/settings/departure-mail',
      '/settings/mail-templates',
    ],
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
    title: 'Bestand',
    to: '/bestand',
    icon: Shirt,
  },
  {
    title: 'Integrationen',
    to: '/settings/integrations',
    icon: Plug,
  },
  {
    title: 'Zahlungen',
    to: '/settings/payments',
    icon: CreditCard,
    adminOnly: true,
  },
];
