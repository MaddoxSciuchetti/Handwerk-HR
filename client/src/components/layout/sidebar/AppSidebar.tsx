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
import { Link } from '@tanstack/react-router';

import { LAYOUTITEMS } from '@/constants/layout.consts';
import useAuth from '@/features/user-profile/hooks/useAuth';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '../../ui/button';
import UserMenu from './UserMenu';

export function AppSidebar({ openModal }: { openModal: () => void }) {
  const { user } = useAuth();
  const fullName = `${user?.vorname ?? ''} ${user?.nachname ?? ''}`.trim();

  const hasPermission = useMemo(() => {
    return (requiredPermission: string | undefined) => {
      if (!requiredPermission) return true;
      if (user?.user_permission !== requiredPermission) return false;
      return true;
    };
  }, [user?.user_permission]);

  const isItem = useRef<HTMLButtonElement | null>(null);

  const accessibleItems = useMemo(() => {
    if (!user) return [];
    return LAYOUTITEMS.filter((value) =>
      hasPermission(value.requiredPermission)
    );
  }, [hasPermission, user]);

  useEffect(() => {
    isItem.current?.focus();
  }, [user]);

  if (user === undefined) {
    return '';
  }
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
                {accessibleItems.map((item, index) => {
                  const isTarget = item.to === '/worker-lifycycle';
                  return (
                    <SidebarMenuItem className="" key={index}>
                      <SidebarMenuButton
                        variant={'outline'}
                        ref={isTarget ? isItem : undefined}
                        asChild
                        className="mt-2 rounded-xl py-5 transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span className="text-muted-foreground text-md">
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
          className="mx-1 mb-1 cursor-pointer rounded-xl bg-muted transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)"
        >
          Feature Request{' '}
        </Button>
        {/* <Button onClick={toggle}>Dark Mode</Button> */}
      </Sidebar>
    </>
  );
}
