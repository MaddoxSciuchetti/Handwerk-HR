import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (search: Record<string, unknown>) => ({
    workerName: (search.workerName as string) || '',
    prevPage: (search.prevPage as string) || '',
  }),
  component: UserPage,
});

function UserPage() {
  const { Id: workerId } = Route.useParams();

  return <TaskManagement workerId={workerId} />;
}
