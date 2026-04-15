import { LAYOUTITEMS } from '@/constants/layout.consts';
import { cn } from '@/lib/trycatch';

import { MessageSquareIcon } from 'lucide-react';
import '../../../../globals.css';
import { ProfileDropdown } from '../selfmade/profiledropdown';
import { SidebarItem } from '../selfmade/sidebaritem';
import { Sidebar, useSidebar } from './sidebar';
import SideBarMenu from './sidebar-menu-item';

function AppSidebar({
  openModal,
  setIsSettingOpen,
  className,
}: {
  openModal: () => void;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
  className?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar
      collapsible="icon"
      className={cn('flex flex-col justify-between', className)}
    >
      <div className="w-full p-2">
        <ProfileDropdown
          setIsSettingOpen={setIsSettingOpen}
          collapsed={isCollapsed}
        />
        <div className="mt-5">
          <SideBarMenu
            collapsed={isCollapsed}
            items={LAYOUTITEMS.map((item) => ({
              id: item.to,
              label: item.title,
              icon: item.icon,
              to: item.to,
              search:
                item.to === '/org-settings'
                  ? { currentTab: 'employees' }
                  : undefined,
            }))}
          />
        </div>
      </div>
      <div className="p-2 w-full flex flex-col overflow-x-hidden">
        <SidebarItem
          onClick={() => openModal()}
          label="Feedback"
          icon={MessageSquareIcon}
          collapsed={isCollapsed}
        />
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
