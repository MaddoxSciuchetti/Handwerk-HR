import PlanPickerPage from '@/features/settings/payments/PlanPickerPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/plans')({
  component: RouteComponent,
});

function RouteComponent() {
  return <PlanPickerPage />;
}
