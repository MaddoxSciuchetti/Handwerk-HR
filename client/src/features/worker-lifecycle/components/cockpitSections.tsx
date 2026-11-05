import { BestandTab } from '@/features/bestand/BestandTab';
import { DocumentsPage } from '@/features/settings/documents/DocumentsPage';
import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import Templates from '@/features/template-tasks/components/Templates';
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

export function CockpitSectionBody({
  id,
  isLoading,
}: {
  id: CockpitSectionId;
  isLoading: boolean;
}) {
  switch (id) {
    case 'templates':
      return <Templates />;
    case 'documents':
      return <DocumentsPage />;
    case 'questionnaire':
      return <QuestionnaireTemplatePage />;
    case 'bestand':
      return <BestandTab isLoading={isLoading} />;
  }
}
