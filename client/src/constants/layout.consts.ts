import { Inbox, Settings } from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
  },
  {
    title: 'Aufgaben',
    to: '/template',
    icon: Settings,
    requiredPermission: 'CHEF',
  },
];
