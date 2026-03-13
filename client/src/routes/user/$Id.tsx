import TaskManagement from '@/features/task-management/components/tasks/TaskManagement';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (search: Record<string, unknown>) => ({
    lifecycleType: (search.lifecycleType as LifecycleType) || '',
  }),
  component: UserPage,
});

function UserPage() {
  const { Id } = Route.useParams();
  let workerId = parseInt(Id);
  const numericId = parseInt(String(workerId));

  const { lifecycleType } = Route.useSearch();

  return <TaskManagement workerId={numericId} lifecycleType={lifecycleType} />;
}
