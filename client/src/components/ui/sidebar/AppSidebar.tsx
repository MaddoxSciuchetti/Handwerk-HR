import { LAYOUTITEMS } from '@/constants/layout.consts';
import { tasksQueries } from '@/features/all-tasks/query/tasks.query';
import { openMentionTasks } from '@/features/all-tasks/utilts/mention-tasks.utils';
import { useQuery } from '@tanstack/react-query';
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
  const { data: tasks } = useQuery(tasksQueries.fetchTasks());
  const mentionCount = openMentionTasks(tasks).length;

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
          items={LAYOUTITEMS.filter(
            (item) => item.to !== '/tasks' && item.to !== '/team'
          ).map((item) => ({
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
    </Sidebar>
  );
}

export default AppSidebar;
