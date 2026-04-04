import OrgSettings from '@/features/org-settings/components/OrgSettings';
import { parseOrgSettingsTabId } from '@/features/org-settings/utils/parseTab';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/org-settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    currentTab: parseOrgSettingsTabId(search.currentTab),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { currentTab } = Route.useSearch();
  return <OrgSettings currentTab={currentTab} />;
}
