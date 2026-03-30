import type { LucideIcon } from 'lucide-react';
import { CircleDot, FolderKanban, LayoutTemplate, Users } from 'lucide-react';

export const ORG_SETTINGS_TAB_IDS = [
  'employees',
  'templates',
  'project-status',
  'issue-status',
] as const;

export type OrgSettingsTabId = (typeof ORG_SETTINGS_TAB_IDS)[number];

export function parseOrgSettingsTabId(raw: unknown): OrgSettingsTabId {
  if (
    typeof raw === 'string' &&
    (ORG_SETTINGS_TAB_IDS as readonly string[]).includes(raw)
  ) {
    return raw as OrgSettingsTabId;
  }
  return 'employees';
}

export const ORG_SETTINGS_NAV: {
  id: OrgSettingsTabId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: 'employees', label: 'Mitarbeiter', icon: Users },
  { id: 'templates', label: 'Vorlagen', icon: LayoutTemplate },
  { id: 'project-status', label: 'Projekt-Status', icon: FolderKanban },
  { id: 'issue-status', label: 'Issue-Status', icon: CircleDot },
];
