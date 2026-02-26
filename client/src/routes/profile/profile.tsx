import Profile from '@/features/user-profile/components/Profile';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/profile/profile')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Profile />;
}
