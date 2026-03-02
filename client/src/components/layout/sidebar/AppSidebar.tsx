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
import { useMemo } from 'react';
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

  const accessibleItems = useMemo(() => {
    if (!user) return [];
    return LAYOUTITEMS.filter((value) =>
      hasPermission(value.requiredPermission)
    );
  }, [hasPermission, user]);

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
            <SidebarGroupLabel className="text-black">
              BSB Team
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="text-black">
                {accessibleItems.map((item, index) => (
                  <SidebarMenuItem className="text-black" key={index}>
                    <SidebarMenuButton asChild className="mt-2">
                      <Link to={item.to}>
                        <item.icon />
                        <span className="">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <Button
          onClick={() => openModal()}
          variant={'outline'}
          className="mb-1 cursor-pointer mx-1 bg-blue-100"
        >
          Feature Request{' '}
        </Button>
        {/* <Button onClick={toggle}>Dark Mode</Button> */}
      </Sidebar>
    </>
  );
}
