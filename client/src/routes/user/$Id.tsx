import TaskManagement from '@/features/task-management/components/tasks/TaskManagement';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (search: Record<string, unknown>) => ({
    lifecycleType: (search.lifecycleType as string) || '',
  }),
  component: UserPage,
});

function UserPage() {
  const { Id } = Route.useParams();
  let workerId = parseInt(Id);
  const numericId = parseInt(String(workerId));

  const { lifecycleType } = Route.useSearch();
  console.log('this is the lifycycle ', lifecycleType);

  return <TaskManagement workerId={numericId} lifecycleType={lifecycleType} />;
}
