import { HandMetal, Home, Inbox, Settings } from 'lucide-react';

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

import useAuth from '@/features/user-profile/hooks/use-Auth';
import { useThemeProvider } from '@/hooks/use-themeProvider';
import { useMemo } from 'react';
import { Button } from '../../ui/button';
import UserMenu from './UserMenu';

const items = [
  {
    title: 'Mein Mitarbeiter',
    to: '/mitarbeiter-uebersicht',
    icon: Home,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Meine Handwerker',
    to: '/handwerker',
    icon: Inbox,
  },
  {
    title: 'Vorlage',
    to: '/template-konfiguration',
    icon: Settings,
    requiredPermission: 'CHEF',
  },
  {
    title: 'Mitarbeiter Monitor',
    to: '/dashboard/ceo',
    icon: HandMetal,
    requiredPermission: 'CHEF',
  },
];

export function AppSidebar({
  openModal,
  toggle,
}: {
  openModal: () => void;
  toggle: () => void;
}) {
  const { user, isError } = useAuth();

  const hasPermission = useMemo(() => {
    return (requiredPermission: string | undefined) => {
      if (!requiredPermission) return true;
      if (user?.user_permission !== requiredPermission) return false;
      return true;
    };
  }, [user?.user_permission]);
  const { theme } = useThemeProvider();

  const accessibleItems = useMemo(() => {
    if (!user) return [];
    return items.filter((item) => hasPermission(item.requiredPermission));
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
        <Button onClick={toggle}>Dark Mode</Button>
      </Sidebar>
    </>
  );
}
