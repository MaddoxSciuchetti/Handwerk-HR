import { LAYOUTITEMS } from '@/constants/layout.consts';

import { MessageSquareIcon } from 'lucide-react';
import '../../../../globals.css';
import { ProfileDropdown } from '../selfmade/profiledropdown';
import { SidebarItem } from '../selfmade/sidebaritem';
import { Sidebar } from './sidebar';
import SideBarMenu from './sidebar-menu-item';

function AppSidebar({ openModal }: { openModal: () => void }) {
  return (
    <Sidebar>
      <div className="w-full p-2">
        <ProfileDropdown />
        <div className="mt-5">
          <SideBarMenu
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
        />
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
