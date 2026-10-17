import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/automation')({
  beforeLoad: () => {
    throw redirect({ to: '/settings/integrations' });
  },
});
