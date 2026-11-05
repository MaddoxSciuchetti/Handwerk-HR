import {
  ClipboardList,
  FileText,
  ScrollText,
  Shirt,
  type LucideIcon,
} from 'lucide-react';

export const COCKPIT_SECTION_IDS = [
  'templates',
  'documents',
  'questionnaire',
  'bestand',
] as const;

export type CockpitSectionId = (typeof COCKPIT_SECTION_IDS)[number];

export type CockpitSection = {
  id: CockpitSectionId;
  title: string;
  icon: LucideIcon;
};

export const COCKPIT_SECTIONS: readonly CockpitSection[] = [
  {
    id: 'templates',
    title: 'Templates',
    icon: FileText,
  },
  {
    id: 'documents',
    title: 'Dokumente',
    icon: ScrollText,
  },
  {
    id: 'questionnaire',
    title: 'Fragebogen',
    icon: ClipboardList,
  },
  {
    id: 'bestand',
    title: 'Bestand',
    icon: Shirt,
  },
];

/** Settings nav targets that now live under Cockpit — hide from SettingsSidebar. */
export const COCKPIT_OWNED_SETTINGS_PATHS = [
  '/settings/templates/template',
  '/settings/documents',
  '/settings/questionnaire',
  '/bestand',
] as const;

/** True for Cockpit section routes (and their detail URLs) that must not open settings chrome. */
export function isCockpitOwnedPath(pathname: string): boolean {
  if (pathname === '/bestand') return true;
  return (
    pathname.startsWith('/settings/documents') ||
    pathname.startsWith('/settings/templates') ||
    pathname.startsWith('/settings/questionnaire') ||
    pathname.startsWith('/settings/mail-templates') ||
    pathname.startsWith('/settings/welcome-mail') ||
    pathname.startsWith('/settings/departure-mail')
  );
}
