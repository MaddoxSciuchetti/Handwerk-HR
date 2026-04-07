import { LAYOUTITEMS } from '@/constants/layout.consts';
import SideBarMenu from '@/features/org-settings/components/SideBarMenu';
import { useLocation } from '@tanstack/react-router';
import { MessageSquareIcon } from 'lucide-react';
import '../../../../globals.css';
import { ProfileDropdown } from '../selfmade/profiledropdown';
import { SidebarItem } from '../selfmade/sidebaritem';
import { Sidebar } from './Sidebar';
function AppSidebar({ openModal }: { openModal: () => void }) {
  const { pathname } = useLocation();
  return (
    <Sidebar>
      <div className="w-full p-2">
        <ProfileDropdown />
      </div>
      <div className="p-2 w-full flex flex-col text-left items-stretch overflow-x-hidden">
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
