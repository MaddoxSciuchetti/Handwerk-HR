import { AutomationPage } from '@/features/settings/automation/AutomationPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/automation')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AutomationPage />;
}
