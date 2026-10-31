import {
  ClipboardList,
  FileText,
  Inbox,
  LayoutDashboard,
  Plug,
  ScrollText,
  Shirt,
  UserRound,
} from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Cockpit',
    to: '/cockpit',
    icon: LayoutDashboard,
  },
  {
    title: 'Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
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
];
