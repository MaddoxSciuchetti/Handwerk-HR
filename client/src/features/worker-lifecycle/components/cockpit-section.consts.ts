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
