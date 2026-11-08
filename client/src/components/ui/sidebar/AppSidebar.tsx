import { LAYOUTITEMS } from '@/constants/layout.consts';
import { ProfileDropdown } from './ProfileDropdown';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { BookOpen } from 'lucide-react';
import { Link } from '@tanstack/react-router';
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
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
          <div className="flex min-w-0 flex-1 items-center group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center">
            <ProfileDropdown
              setIsSettingOpen={setIsSettingOpen}
              subscriptionLocked={subscriptionLocked}
            />
          </div>
          <SidebarTrigger className="shrink-0 self-center" />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4 pt-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
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
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dokumentation">
              <Link to="/docs/$" params={{ _splat: '' }}>
                <BookOpen />
                <span>Dokumentation</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
