import {
  ORG_SETTINGS_TAB_IDS,
  OrgSettingsTabId,
} from '../types/org-settings.types';

export function parseOrgSettingsTabId(raw: unknown): OrgSettingsTabId {
  if (
    typeof raw === 'string' &&
    (ORG_SETTINGS_TAB_IDS as readonly string[]).includes(raw)
  ) {
    return raw as OrgSettingsTabId;
  }
  return 'employees';
}
