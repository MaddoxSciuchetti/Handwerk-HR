import Profile from '@/features/settings/profile/Profile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Profile />;
}
