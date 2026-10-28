import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/general')({
  beforeLoad: ({ location }) => {
    throw redirect({
      href: `/settings/integrations${location.searchStr}`,
      replace: true,
    });
  },
});
