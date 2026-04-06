import {
  BriefcaseIcon,
  MessageSquareIcon,
  TicketIcon,
  UsersIcon,
} from 'lucide-react';
import '../../../../globals.css';
import { ProfileDropdown } from '../selfmade/profiledropdown';
import { SidebarItem } from '../selfmade/sidebaritem';
import { Sidebar } from './Sidebar';
function AppSidebar({ openModal }: { openModal: () => void }) {
  return (
    <Sidebar>
      <div className="w-full p-2">
        <ProfileDropdown />
      </div>
      <div className="p-2 w-full flex flex-col text-left items-stretch overflow-x-hidden">
        <SidebarItem label="Handwerker" icon={UsersIcon} />
        <SidebarItem label="Aufgaben" icon={TicketIcon} />
        <SidebarItem label="Unternehmen" icon={BriefcaseIcon} />
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
