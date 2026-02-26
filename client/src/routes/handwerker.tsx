import WorkerLifeCycle from '@/features/worker-lifecycle/components/WorkerLifecycle';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/handwerker')({
  component: RouteComponent,
});

function RouteComponent() {
  return <WorkerLifeCycle />;
}
