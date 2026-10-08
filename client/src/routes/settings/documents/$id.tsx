import { DocumentMasterEditor } from '@/features/settings/documents/DocumentMasterEditor';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/documents/$id')({
  component: DocumentRoute,
});

function DocumentRoute() {
  const { id } = Route.useParams();
  return <DocumentMasterEditor id={id} />;
}
