import { HandMetal, Home, Inbox, Settings } from 'lucide-react';

export const LAYOUTITEMS = [
  {
    title: 'Mein Mitarbeiter',
    to: '/mitarbeiter-uebersicht',
    icon: Home,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Meine Handwerker',
    to: '/handwerker',
    icon: Inbox,
  },
  {
    title: 'Vorlage',
    to: '/template-konfiguration',
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
