import { cn } from '@/lib/trycatch';
import type { ComponentProps } from 'react';

export type SidebarAsideProps = ComponentProps<'aside'> & {
  isOpen: boolean;
};

export function SidebarAside({
  className,
  isOpen,
  children,
  ...props
}: SidebarAsideProps) {
  return (
    <aside
      className={cn(
        'fixed right-1 top-1 bottom-1 z-50 overflow-hidden rounded-4xl border border-border bg-(--card) transition-all duration-300 ease-out',
        isOpen ? 'w-110' : 'w-0',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
