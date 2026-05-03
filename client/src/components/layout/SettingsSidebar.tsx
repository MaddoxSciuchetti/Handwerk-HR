import { SETTINGSITEMS } from '@/constants/layout.consts';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '../ui/selfmade/button';
import { Sidebar, useSidebar } from '../ui/sidebar/sidebar';
import SideBarMenu from '../ui/sidebar/sidebar-menu-item';

export function SettingsSidebar({
  setIsSettingOpen,
  subscriptionLocked,
  className,
}: {
  className?: string;
  subscriptionLocked: boolean;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
}) {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const leaveSettings = () => {
    if (subscriptionLocked) return;
    setIsSettingOpen(false);
    navigate({ to: '/worker-lifycycle' });
  };

  const itemsSource = subscriptionLocked
    ? SETTINGSITEMS.filter((item) => item.to === '/settings/payments')
    : SETTINGSITEMS;

  return (
    <Sidebar collapsible="icon" className={className}>
      <div className="w-full p-2">
        {!subscriptionLocked ? (
          <Button
            type="button"
            size="icon"
            className="bg-transparent text-foreground shadow-none hover:bg-muted"
            onClick={leaveSettings}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="mt-5">
          <SideBarMenu
            collapsed={isCollapsed}
            items={itemsSource.map((item) => ({
              id: item.to,
              label: item.title,
              icon: item.icon,
              to: item.to,
            }))}
          />
        </div>
      </div>
    </Sidebar>
  );
}
