import { DocumentMasterEditor } from '@/features/settings/documents/DocumentMasterEditor';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/documents/$id')({
  validateSearch: (
    search: Record<string, unknown>
  ): { returnContract?: '1' } =>
    search.returnContract === '1' ? { returnContract: '1' } : {},
  component: DocumentRoute,
});

function DocumentRoute() {
  const { id } = Route.useParams();
  const { returnContract } = Route.useSearch();
  return (
    <DocumentMasterEditor id={id} returnContract={returnContract === '1'} />
  );
}
