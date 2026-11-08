import { SETTINGSITEMS } from '@/constants/layout.consts';
import { Button } from '@/components/ui/button';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { COCKPIT_OWNED_SETTINGS_PATHS } from '@/features/worker-lifecycle/components/cockpit-section.consts';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import SideBarMenu from '../ui/sidebar/sidebar-menu-item';

const cockpitSectionPaths = new Set<string>(COCKPIT_OWNED_SETTINGS_PATHS);

export function SettingsSidebar({
  setIsSettingOpen,
  subscriptionLocked,
}: {
  subscriptionLocked: boolean;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.membershipRole === 'admin';

  const leaveSettings = () => {
    if (subscriptionLocked) return;
    setIsSettingOpen(false);
    navigate({ to: '/worker-lifycycle' });
  };

  const visibleItems = SETTINGSITEMS.filter(
    (item) =>
      !cockpitSectionPaths.has(item.to) &&
      (!('adminOnly' in item && item.adminOnly) || isAdmin)
  );
  const itemsSource = subscriptionLocked
    ? visibleItems.filter((item) => item.to === '/settings/payments')
    : visibleItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
          {!subscriptionLocked ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="self-center"
              onClick={leaveSettings}
            >
              <ArrowLeftIcon />
              <span className="sr-only">Zurück</span>
            </Button>
          ) : (
            <span />
          )}
          <SidebarTrigger className="shrink-0 self-center" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 pt-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <SideBarMenu
          items={itemsSource.map((item) => ({
            id: item.to,
            label: item.title,
            icon: item.icon,
            to: item.to,
            activePaths: 'activePaths' in item ? item.activePaths : undefined,
          }))}
        />
      </SidebarContent>
    </Sidebar>
  );
}
