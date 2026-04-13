import { OrgStatusesSettingsPage } from '@/features/settings/org-statuses/OrgStatusesSettingsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/engagement-statuses')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OrgStatusesSettingsPage
      entityType="engagement"
      title="Handwerker"
      description="Verwalte die Status-Stufen für Handwerker (Projektfortschritt) in deinem Unternehmen."
    />
  );
}
