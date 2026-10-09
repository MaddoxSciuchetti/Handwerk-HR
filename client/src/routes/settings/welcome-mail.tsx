import { WelcomeMailPage } from '@/features/settings/welcome-mail/WelcomeMailPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/welcome-mail')({
  component: RouteComponent,
});

function RouteComponent() {
  return <WelcomeMailPage />;
}
