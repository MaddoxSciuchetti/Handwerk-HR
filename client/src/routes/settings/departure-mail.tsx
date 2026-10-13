import { DepartureMailPage } from '@/features/settings/departure-mail/DepartureMailPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/departure-mail')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DepartureMailPage />;
}
