import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

export type SideBarMenuLinkItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  to: string;
  search?: Record<string, unknown>;
};

export type SideBarMenuProps<T extends SideBarMenuLinkItem> = {
  items: readonly T[];
  isItemActive: (item: T) => boolean;
};

function SideBarMenu<TItem extends SideBarMenuLinkItem>({
  items,
  isItemActive,
}: SideBarMenuProps<TItem>) {
  return (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = isItemActive(item);
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              variant="outline"
              asChild
              className="mt-2 rounded-xl py-5 transition-colors"
            >
              <Link
                to={item.to}
                {...(item.search !== undefined ? { search: item.search } : {})}
                className={
                  isActive
                    ? 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--muted)]'
                    : 'hover:bg-[var(--hover-bg)] hover:text-[var(--hover-foreground)]'
                }
              >
                <Icon className="size-[1.15rem] shrink-0" />
                <span
                  className={
                    isActive
                      ? 'text-md font-medium text-[var(--foreground)]'
                      : 'text-md text-muted-foreground'
                  }
                >
                  {item.label}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export default SideBarMenu;
