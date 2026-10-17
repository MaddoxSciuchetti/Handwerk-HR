import { MailTemplatePage } from '@/features/settings/mail-template/MailTemplatePage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/mail-templates/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <MailTemplatePage templateId={id} />;
}
