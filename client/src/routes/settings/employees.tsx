import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/employees')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/profile' });
  },
});
