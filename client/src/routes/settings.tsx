import Settings from '@/features/user-profile/components/Settings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Settings />;
}
