import { LAYOUTITEMS } from '@/constants/layout.consts';
import { tasksQueries } from '@/features/all-tasks/query/tasks.query';
import { openMentionTasks } from '@/features/all-tasks/utilts/mention-tasks.utils';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { MessageSquareIcon } from 'lucide-react';
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
  const { user } = useAuth();
  const { data: tasks } = useQuery(tasksQueries.fetchTasks());
  const mentionCount = openMentionTasks(tasks, user?.id).length;

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
            badge: item.to === '/tasks' ? mentionCount : undefined,
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
