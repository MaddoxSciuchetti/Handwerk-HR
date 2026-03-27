import OrgSettings from '@/features/org-settings/components/OrgSettings';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/org-settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return <OrgSettings />;
}
