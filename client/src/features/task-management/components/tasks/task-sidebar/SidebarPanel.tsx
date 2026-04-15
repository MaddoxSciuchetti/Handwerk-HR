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
      className={cn('flex h-full min-h-0 w-105 flex-col pt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
