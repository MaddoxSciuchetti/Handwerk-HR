import { TableSkeletonRows } from '@/components/ui/table-skeleton';
import { Table, TableBody } from '@/components/ui/table';
import { QuestionnaireSkeleton } from '@/features/settings/questionnaire/QuestionnaireSkeleton';
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

function SectionFallback({ id }: { id: CockpitSectionId }) {
  if (id === 'questionnaire') {
    return (
      <div className="p-4">
        <QuestionnaireSkeleton />
      </div>
    );
  }

  const variant =
    id === 'templates'
      ? 'templates'
      : id === 'documents'
        ? 'documents'
        : 'stock';

  return (
    <div className="p-4">
      <Table aria-busy="true">
        <TableBody>
          <TableSkeletonRows variant={variant} />
        </TableBody>
      </Table>
    </div>
  );
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

  return (
    <Suspense fallback={<SectionFallback id={id} />}>{body}</Suspense>
  );
}
