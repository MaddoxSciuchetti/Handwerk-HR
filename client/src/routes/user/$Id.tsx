import TaskManagement from '@/features/worker-task-management/components/tasks/WorkerTaskManagement';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/user/$Id')({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    workerName: string;
    prevPage: string;
    taskId?: string;
  } => ({
    workerName: (search.workerName as string) || '',
    prevPage: (search.prevPage as string) || '',
    taskId: typeof search.taskId === 'string' ? search.taskId : undefined,
  }),
  component: UserPage,
});

function UserPage() {
  const { Id: workerId } = Route.useParams();
  const { taskId } = Route.useSearch();

  return <TaskManagement workerId={workerId} taskId={taskId} />;
}
