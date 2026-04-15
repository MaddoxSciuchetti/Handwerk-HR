import { cn } from '@/lib/trycatch';
import type { ComponentProps } from 'react';

export type SidebarHeaderProps = ComponentProps<'div'>;

function SidebarHeader({ className, children, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn('shrink-0 border-b border-border py-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default SidebarHeader;
