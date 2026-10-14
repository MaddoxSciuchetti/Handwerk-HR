import { LandingPage } from '@/features/landing/LandingPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/landing')({
  component: LandingPage,
});
