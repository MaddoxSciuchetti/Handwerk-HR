import TemplateTasks from '@/features/TemplateTasks/components/TemplateTask';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/template-konfiguration')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TemplateTasks />;
}
