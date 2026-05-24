import Tasks from '@/features/all-tasks/components/Tasks';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/tasks')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Tasks />;
}
