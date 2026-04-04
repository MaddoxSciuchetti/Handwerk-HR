import RegisterOrg from '@/features/auth/components/RegisterOrg';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/register-org')({
  component: RouteComponent,
});

function RouteComponent() {
  return <RegisterOrg />;
}
