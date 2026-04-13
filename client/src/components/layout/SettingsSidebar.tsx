import { SETTINGSITEMS } from '@/constants/layout.consts';
import { ArrowLeftIcon } from 'lucide-react';
import { Button } from '../ui/selfmade/button';
import { Sidebar, useSidebar } from '../ui/sidebar/sidebar';
import SideBarMenu from '../ui/sidebar/sidebar-menu-item';

export function SettingsSidebar({
  setIsSettingOpen,
  className,
}: {
  className?: string;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className={className}>
      <div className="w-full p-2">
        <Button onClick={() => setIsSettingOpen(false)}>
          <ArrowLeftIcon className="w-6 h-6" />
        </Button>
        <div className="mt-5">
          <SideBarMenu
            collapsed={isCollapsed}
            items={SETTINGSITEMS.map((item) => ({
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
