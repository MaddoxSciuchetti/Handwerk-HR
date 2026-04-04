import TemplateDetailPage from '@/features/template-tasks/components/TemplateDetailPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/template/$templateId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { templateId } = Route.useParams();
  return <TemplateDetailPage templateId={templateId} />;
}
