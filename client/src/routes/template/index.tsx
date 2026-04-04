import TemplateTasks from '@/features/template-tasks/components/TemplateTask';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/template/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] min-h-0 w-full max-w-[min(100%,90rem)] flex-col px-4 py-4">
      <TemplateTasks />
    </div>
  );
}
