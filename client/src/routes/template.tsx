import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/template')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TemplateTasks />;
}
