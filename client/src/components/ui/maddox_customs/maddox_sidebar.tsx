import * as React from 'react';
import { cn } from '@/types/utils';

type SidebarProps = React.HTMLAttributes<HTMLElement>;

function Sidebar({ className, ...props }: SidebarProps) {
  return (
    <aside
      className={cn('w-3xs shrink-0 border-r  text-foreground', className)}
      {...props}
    />
  );
}

type SectionProps = React.HTMLAttributes<HTMLDivElement>;

function SidebarSection({ className, ...props }: SectionProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground p-4',
        className
      )}
      {...props}
    />
  );
}

export { Sidebar, SidebarSection };
