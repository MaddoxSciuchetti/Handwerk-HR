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
} from '@/components/ui/sidebar';
import { BookOpen } from 'lucide-react';
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
      <SidebarFooter className="mt-auto px-2 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dokumentation">
              <a
                href={
                  import.meta.env.VITE_DOCS_URL ?? 'http://localhost:3001/docs'
                }
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen />
                <span>Dokumentation</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
