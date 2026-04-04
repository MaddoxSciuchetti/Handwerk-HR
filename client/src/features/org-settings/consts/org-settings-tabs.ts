import { CircleDot, FolderKanban, LayoutTemplate, Users } from 'lucide-react';
import { OrgSettingsNavItem } from '../types/org-settings.types';

export const ORG_SETTINGS_NAV_GROUPS: {
  heading: string;
  items: OrgSettingsNavItem[];
}[] = [
  {
    heading: 'Organisation',
    items: [
      { id: 'employees', label: 'Mitarbeiter', icon: Users },
      { id: 'templates', label: 'Vorlagen', icon: LayoutTemplate },
    ],
  },
  {
    heading: 'Projekte & Issues',
    items: [
      { id: 'project-status', label: 'Projekt-Status', icon: FolderKanban },
      { id: 'issue-status', label: 'Issue-Status', icon: CircleDot },
    ],
  },
];
