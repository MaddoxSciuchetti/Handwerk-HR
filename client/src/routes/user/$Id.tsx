import TaskManagement from '@/features/task-management/components/tasks/TaskManagement';
import { LifecycleType } from '@/features/task-management/types/index.types';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (search: Record<string, unknown>) => ({
    lifecycleType: (search.lifecycleType as LifecycleType) || '',
    workerName: (search.workerName as string) || '',
    prevPage: (search.prevPage as string) || '',
  }),
  component: UserPage,
});

function UserPage() {
  const { Id } = Route.useParams();
  const { lifecycleType } = Route.useSearch();

  return (
    <TaskManagement workerId={Id} lifecycleType={lifecycleType} />
  );
}
