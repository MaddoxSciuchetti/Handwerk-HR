import { BestandTab } from '@/features/bestand/BestandTab';
import { DocumentsPage } from '@/features/settings/documents/DocumentsPage';
import { QuestionnaireTemplatePage } from '@/features/settings/questionnaire/QuestionnaireTemplatePage';
import Templates from '@/features/template-tasks/components/Templates';
import type { CockpitSectionId } from './cockpit-section.consts';

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
