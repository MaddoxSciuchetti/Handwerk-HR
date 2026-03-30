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
import { ORG_SETTINGS_NAV } from '@/features/org-settings/consts/org-settings-tabs';
import { Link, useRouterState } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';

const backTarget =
  LAYOUTITEMS.find((item) => item.to !== '/org-settings')?.to ??
  '/worker-lifycycle';

export function SettingsSidebar() {
  const activeTab = useRouterState({
    select: (s) => {
      if (s.location.pathname !== '/org-settings') return 'employees';
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
            variant="outline"
            asChild
            className="h-auto w-full justify-start gap-2 rounded-xl py-3.5 text-left font-medium"
          >
            <Link to={backTarget}>
              <ArrowLeft className="size-5 shrink-0" />
              Zurück zur Übersicht
            </Link>
          </Button>
        </div>
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-xs text-muted-foreground">
            Einstellungen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ORG_SETTINGS_NAV.map((item) => {
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
                        search={{ tab: item.id }}
                        className={
                          isActive
                            ? 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                            : 'hover:bg-[var(--hover-bg)] hover:text-[var(--hover-foreground)]'
                        }
                      >
                        <Icon className="size-[1.15rem] shrink-0" />
                        <span
                          className={
                            isActive
                              ? 'text-md font-medium text-[var(--foreground)]'
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
      </SidebarContent>
    </Sidebar>
  );
}
