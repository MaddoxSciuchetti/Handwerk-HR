import { OrgStatusesSettingsPage } from '@/features/settings/org-statuses/OrgStatusesSettingsPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/settings/issue-statuses')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <OrgStatusesSettingsPage
      entityType="issue"
      title="Aufgaben"
      description="Verwalte die Status-Stufen für Aufgaben in deinem Unternehmen."
    />
  );
}
