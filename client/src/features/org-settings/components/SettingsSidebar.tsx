import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { LAYOUTITEMS } from '@/constants/layout.consts';
import {
  ORG_SETTINGS_NAV,
  ORG_SETTINGS_NAV_GROUPS,
} from '@/features/org-settings/consts/org-settings-tabs';
import { cn } from '@/lib/utils';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

const backTarget =
  LAYOUTITEMS.find((item) => item.to !== '/org-settings')?.to ??
  '/worker-lifycycle';

export function SettingsSidebar() {
  const activeTab = useRouterState({
    select: (s) => {
      const { pathname } = s.location;
      if (pathname.startsWith('/template')) return 'templates';
      if (pathname !== '/org-settings') return 'employees';
      const tab = (s.location.search as { tab?: string }).tab;
      const match = ORG_SETTINGS_NAV.find((n) => n.id === tab);
      return match?.id ?? 'employees';
    },
  });

  return (
    <Sidebar className="p-5">
      <SidebarContent>
        <div className="border-b border-border px-1 pb-4">
          <Button
            size={"sm"}
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
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        variant="outline"
                        asChild
                        className="mt-2 rounded-xl py-5 transition-colors"
                      >
                        <Link
                          to="/org-settings"
                          search={{ currentTab: item.id }}
                          className={
                            isActive  
                              ? 'bg-muted text-foreground hover:bg-muted'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }
                        >
                          <Icon className="size-[1.15rem] shrink-0" />
                          <span
                            className={
                              isActive
                                ? 'text-md font-medium text-foreground'
                                : 'text-md text-muted-foreground'
                            }
                          >
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
