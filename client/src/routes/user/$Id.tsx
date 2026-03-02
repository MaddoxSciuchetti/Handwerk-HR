import TaskManagement from '@/features/task-management/components/tasks/TaskManagement';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (search: Record<string, unknown>) => ({
    param1: (search.param1 as string) || '',
  }),
  component: UserPage,
});

function UserPage() {
  const { Id } = Route.useParams();
  let id = parseInt(Id);

  const search = Route.useSearch();

  return <TaskManagement id={id} search={search} />;
}
