import Templates from '@/features/template-tasks/components/Templates';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/templates/template')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Templates />;
}
