import { LAYOUTITEMS } from '@/constants/layout.consts';
import { ProfileDropdown } from './ProfileDropdown';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import SideBarMenu from './sidebar-menu-item';

function AppSidebar({
  setIsSettingOpen,
  subscriptionLocked,
}: {
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
    </Sidebar>
  );
}

export default AppSidebar;
