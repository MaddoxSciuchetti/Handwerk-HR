import OrgSettings from '@/features/org-settings/components/OrgSettings';
import { parseOrgSettingsTabId } from '@/features/org-settings/consts/org-settings-tabs';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/org-settings')({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseOrgSettingsTabId(search.tab),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tab } = Route.useSearch();
  return <OrgSettings tab={tab} />;
}
