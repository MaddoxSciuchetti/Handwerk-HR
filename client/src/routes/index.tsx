import { LandingPage } from '@/features/landing/LandingPage';
import { STAGING_SKIP_LOGIN } from '@/config/env';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Staging demo: /login is the shared entry URL (professor link).
    if (STAGING_SKIP_LOGIN) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});

function HomePage() {
  return <LandingPage />;
}
