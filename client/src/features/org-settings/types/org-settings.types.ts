import { LucideIcon } from 'lucide-react';

export const ORG_SETTINGS_TAB_IDS = [
  'employees',
  'templates',
  'project-status',
  'issue-status',
] as const;

export type OrgSettingsTabId = (typeof ORG_SETTINGS_TAB_IDS)[number];

export type OrgSettingsNavItem = {
  id: OrgSettingsTabId;
  label: string;
  icon: LucideIcon;
};
