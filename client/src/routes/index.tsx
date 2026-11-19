import { StagingAutoEnter } from '@/features/auth/components/StagingAutoEnter';
import { LandingPage } from '@/features/landing/LandingPage';
import { STAGING_SKIP_LOGIN } from '@/config/env';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  if (STAGING_SKIP_LOGIN) {
    return <StagingAutoEnter />;
  }
  return <LandingPage />;
}
