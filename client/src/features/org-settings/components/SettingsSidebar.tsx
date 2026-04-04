import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { LAYOUTITEMS } from '@/constants/layout.consts';
import { ORG_SETTINGS_NAV_GROUPS } from '@/features/org-settings/consts/org-settings-tabs';
import { parseOrgSettingsTabId } from '@/features/org-settings/utils/parseTab';
import { cn } from '@/lib/utils';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import SideBarMenu from './SideBarMenu';

const backTarget =
  LAYOUTITEMS.find((item) => item.to !== '/org-settings')?.to ??
  '/worker-lifycycle';

export function SettingsSidebar() {
  const activeTab = useRouterState({
    select: (s) => {
      const { pathname, search } = s.location;
      if (pathname.startsWith('/template')) return 'templates';
      if (pathname !== '/org-settings') return 'employees';
      const raw =
        search && typeof search === 'object' && 'currentTab' in search
          ? (search as { currentTab?: unknown }).currentTab
          : undefined;
      return parseOrgSettingsTabId(raw);
    },
  });

  return (
    <Sidebar className="p-5">
      <SidebarContent>
        <div className="border-b border-border px-1 pb-4">
          <Button
            size={'sm'}
            variant="outline"
            asChild
            className="h-auto w-full justify-start gap-2 rounded-xl py-1 text-left font-medium hover:(--muted-foreground)"
          >
            <Link to={backTarget}>
              <ArrowLeft className="size-5 shrink-0" />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        {ORG_SETTINGS_NAV_GROUPS.map((group, index) => (
          <SidebarGroup
            key={group.heading}
            className={cn(
              index === 0 ? 'mt-4' : 'mt-6 border-t border-border pt-4'
            )}
          >
            <SidebarGroupLabel className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SideBarMenu
                items={group.items.map((item) => ({
                  id: item.id,
                  label: item.label,
                  icon: item.icon,
                  to: '/org-settings',
                  search: { currentTab: item.id },
                }))}
                isItemActive={(item) => activeTab === item.id}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
