import { HandMetal, Home, Inbox, Settings } from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Mein Mitarbeiter',
    to: '/employee-overview',
    icon: Home,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Meine Handwerker',
    to: '/worker-lifycycle',
    icon: Inbox,
  },
  {
    title: 'Vorlage',
    to: '/template',
    icon: Settings,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Mitarbeiter Monitor',
    to: '/dashboard/ceo',
    icon: HandMetal,
    requiredPermission: 'CHEF',
  },
];
