import TeamPage from '@/features/worker-lifecycle/components/TeamPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/team')({
  component: RouteComponent,
});

function RouteComponent() {
  return <TeamPage />;
}
