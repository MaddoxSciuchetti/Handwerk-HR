import Dashboard from '@/features/Dashboard';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/userdashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Dashboard />;
}
