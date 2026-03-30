import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, useLocation } from '@tanstack/react-router';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import { Button } from '@/components/ui/button';
import { LAYOUTITEMS } from '@/constants/layout.consts';
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
              <SidebarMenu className="">
                {LAYOUTITEMS.map((item, index) => {
                  const isActive =
                    pathname === item.to || pathname.startsWith(`${item.to}/`);

                  return (
                    <SidebarMenuItem className="" key={index}>
                      <SidebarMenuButton
                        variant={'outline'}
                        asChild
                        className="mt-2 rounded-xl py-5 transition-colors"
                      >
                        <Link
                          to={item.to}
                          search={
                            item.to === '/org-settings'
                              ? { tab: 'employees' }
                              : undefined
                          }
                          className={
                            isActive
                              ? 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                              : 'hover:bg-[var(--hover-bg)] hover:text-[var(--hover-foreground)]'
                          }
                        >
                          <item.icon />
                          <span
                            className={
                              isActive
                                ? 'text-[var(--foreground)] text-md font-medium'
                                : 'text-muted-foreground text-md'
                            }
                          >
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
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
