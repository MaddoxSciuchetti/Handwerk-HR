import { LAYOUTITEMS } from '@/constants/layout.consts';
import { MessageSquareIcon } from 'lucide-react';
import { ProfileDropdown } from '../selfmade/profiledropdown';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import SideBarMenu from './sidebar-menu-item';

function AppSidebar({
  openModal,
  setIsSettingOpen,
  subscriptionLocked,
}: {
  openModal: () => void;
  setIsSettingOpen: (isSettingOpen: boolean) => void;
  subscriptionLocked: boolean;
}) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ProfileDropdown
          setIsSettingOpen={setIsSettingOpen}
          subscriptionLocked={subscriptionLocked}
        />
      </SidebarHeader>
      <SidebarContent className="mt-3 px-2">
        <SideBarMenu
          items={LAYOUTITEMS.map((item) => ({
            id: item.to,
            label: item.title,
            icon: item.icon,
            to: item.to,
            disabled: subscriptionLocked,
            search:
              item.to === '/org-settings'
                ? { currentTab: 'employees' }
                : undefined,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Feedback"
              disabled={subscriptionLocked}
              onClick={() => {
                if (!subscriptionLocked) openModal();
              }}
            >
              <MessageSquareIcon />
              <span>Feedback</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
