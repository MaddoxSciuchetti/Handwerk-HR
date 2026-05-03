import { SidebarItem } from '@/components/ui/selfmade/sidebaritem';
import { Link } from '@tanstack/react-router';
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
  collapsed?: boolean;
};

function SideBarMenu<TItem extends SideBarMenuLinkItem>({
  items,
  collapsed = false,
}: SideBarMenuProps<TItem>) {
  return (
    <>
      {items.map((item) => {
        if (item.disabled) {
          return (
            <div
              key={item.id}
              className="pointer-events-none opacity-40"
              aria-disabled
            >
              <SidebarItem
                label={item.label}
                icon={item.icon}
                collapsed={collapsed}
              />
            </div>
          );
        }
        return (
          <Link
            key={item.id}
            to={item.to}
            {...(item.search !== undefined ? { search: item.search } : {})}
          >
            <SidebarItem
              label={item.label}
              icon={item.icon}
              collapsed={collapsed}
            />
          </Link>
        );
      })}
    </>
  );
}

export default SideBarMenu;
