import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { TaskContextProvider } from '@/features/template-tasks/TaskContextProvider';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/templates/template')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <TaskContextProvider>
      <TemplateTasks />
    </TaskContextProvider>
  );
}
