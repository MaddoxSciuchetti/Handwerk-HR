import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, useRouterState } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

export type SideBarMenuLinkItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, unknown>;
  disabled?: boolean;
};

export type SideBarMenuProps<T extends SideBarMenuLinkItem> = {
  items: readonly T[];
};

function isActiveRoute(pathname: string, to: string) {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SideBarMenu<TItem extends SideBarMenuLinkItem>({
  items,
}: SideBarMenuProps<TItem>) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = isActiveRoute(pathname, item.to);
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                aria-disabled
                disabled
                tooltip={item.label}
              >
                <Icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        }

        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.label}
            >
              <Link
                to={item.to}
                {...(item.search !== undefined ? { search: item.search } : {})}
              >
                <Icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default SideBarMenu;
