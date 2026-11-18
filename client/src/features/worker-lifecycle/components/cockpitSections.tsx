import { lazy, Suspense } from 'react';
import type { CockpitSectionId } from './cockpit-section.consts';

const Templates = lazy(
  () => import('@/features/template-tasks/components/Templates')
);
const DocumentsPage = lazy(() =>
  import('@/features/settings/documents/DocumentsPage').then((module) => ({
    default: module.DocumentsPage,
  }))
);
const QuestionnaireTemplatePage = lazy(() =>
  import('@/features/settings/questionnaire/QuestionnaireTemplatePage').then(
    (module) => ({
      default: module.QuestionnaireTemplatePage,
    })
  )
);
const BestandTab = lazy(() =>
  import('@/features/bestand/BestandTab').then((module) => ({
    default: module.BestandTab,
  }))
);

function SectionFallback() {
  return <p className="p-4 text-sm text-muted-foreground">Laden…</p>;
}

export function CockpitSectionBody({
  id,
  isLoading,
}: {
  id: CockpitSectionId;
  isLoading: boolean;
}) {
  let body;
  switch (id) {
    case 'templates':
      body = <Templates />;
      break;
    case 'documents':
      body = <DocumentsPage />;
      break;
    case 'questionnaire':
      body = <QuestionnaireTemplatePage />;
      break;
    case 'bestand':
      body = <BestandTab isLoading={isLoading} />;
      break;
  }

  return <Suspense fallback={<SectionFallback />}>{body}</Suspense>;
}
