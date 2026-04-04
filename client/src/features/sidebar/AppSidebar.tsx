import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { useLocation } from '@tanstack/react-router';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Button } from '@/components/ui/button';
import { LAYOUTITEMS } from '@/constants/layout.consts';
import SideBarMenu from '../org-settings/components/SideBarMenu';
import UserMenu from './UserMenu';
import { SidebarSkeleton } from './components/SidebarSkeleton';
import useHasPermission from './hooks/useHasPermission';

export function AppSidebar({ openModal }: { openModal: () => void }) {
  const { user, isLoading, isError, fullName } = useHasPermission();
  const { pathname } = useLocation();

  if (isLoading) return <SidebarSkeleton />;
  if (isError || !user) return <ErrorAlert />;

  return (
    <>
      <Sidebar className=" p-5">
        <SidebarHeader className="rounded-xl  bg-muted/40 p-2">
          <div className="flex items-center gap-2.5">
            <UserMenu />
            <div className="min-w-0">
              <p className="truncate text-lg leading-none text-foreground font-medium">
                {fullName || 'Unbekannter Nutzer'}
              </p>
              <p className="mt-1 font-light truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
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
                isItemActive={(item) =>
                  pathname === item.id || pathname.startsWith(`${item.id}/`)
                }
              />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Button
          onClick={() => openModal()}
          variant={'outline'}
          className="mx-1 mb-1 cursor-pointer rounded-xl bg-muted transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--hover-foreground)]"
        >
          Was würdest du ändern?{' '}
        </Button>
      </Sidebar>
    </>
  );
}
