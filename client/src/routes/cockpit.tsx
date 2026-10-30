import CockpitPage from '@/features/worker-lifecycle/components/CockpitPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/cockpit')({
  component: CockpitPage,
});
