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
  activePaths?: readonly string[];
  badge?: number;
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
        const isActive =
          isActiveRoute(pathname, item.to) ||
          (item.activePaths?.some((path) => isActiveRoute(pathname, path)) ??
            false);
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
          <SidebarMenuItem key={item.id} className="relative">
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
            {item.badge ? (
              <span
                className="pointer-events-none absolute top-1.5 right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground group-data-[collapsible=icon]:top-0 group-data-[collapsible=icon]:right-0"
                aria-label={`${item.badge} Erwähnungen`}
              >
                {item.badge}
              </span>
            ) : null}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default SideBarMenu;
