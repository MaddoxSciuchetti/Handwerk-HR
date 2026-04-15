import { cn } from '@/lib/trycatch';
import type { ComponentProps } from 'react';

export type SidebarPanelProps = ComponentProps<'div'>;

export function SidebarPanel({
  className,
  children,
  ...props
}: SidebarPanelProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full min-w-0 max-w-full flex-col pt-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
