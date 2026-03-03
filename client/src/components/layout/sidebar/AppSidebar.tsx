import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';

import { LAYOUTITEMS } from '@/constants/layout';
import useAuth from '@/features/user-profile/hooks/use-Auth';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '../../ui/button';
import UserMenu from './UserMenu';

export function AppSidebar({ openModal }: { openModal: () => void }) {
  const { user } = useAuth();

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
      <Sidebar className="bg-sidebar">
        <SidebarHeader className="mt-5 flex flex-row align-middle">
          <UserMenu />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="">BSB Team</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="">
                {accessibleItems.map((item, index) => {
                  const isTarget = item.to === '/worker-lifycycle';
                  return (
                    <SidebarMenuItem className="" key={index}>
                      <SidebarMenuButton
                        ref={isTarget ? isItem : undefined}
                        asChild
                        className="mt-2"
                      >
                        <Link to={item.to}>
                          <item.icon />
                          <span className="text-muted-foreground">
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
          className="mb-1 cursor-pointer mx-1 bg-muted outline border"
        >
          Feature Request{' '}
        </Button>
        {/* <Button onClick={toggle}>Dark Mode</Button> */}
      </Sidebar>
    </>
  );
}
