import { SETTINGSITEMS } from '@/constants/layout.consts';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import SideBarMenu from '../ui/sidebar/sidebar-menu-item';

export function SettingsSidebar({
  setIsSettingOpen,
  subscriptionLocked,
}: {
  subscriptionLocked: boolean;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
}) {
  const navigate = useNavigate();

  const leaveSettings = () => {
    if (subscriptionLocked) return;
    setIsSettingOpen(false);
    navigate({ to: '/worker-lifycycle' });
  };

  const itemsSource = subscriptionLocked
    ? SETTINGSITEMS.filter((item) => item.to === '/settings/payments')
    : SETTINGSITEMS;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        {!subscriptionLocked ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={leaveSettings}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Zurück</span>
          </Button>
        ) : null}
      </SidebarHeader>
      <SidebarContent className="mt-3 px-2">
        <SideBarMenu
          items={itemsSource.map((item) => ({
            id: item.to,
            label: item.title,
            icon: item.icon,
            to: item.to,
          }))}
        />
      </SidebarContent>
    </Sidebar>
  );
}
