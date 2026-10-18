import { cn } from '@/lib/trycatch';
import type { ComponentProps } from 'react';
import '@/components/ui/right-sidebar.css';

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
      aria-hidden={!isOpen}
      inert={!isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      className={cn(
        'right-sidebar fixed right-1 top-1 bottom-1 z-50 w-[calc(100vw-0.5rem)] max-w-2xl overflow-hidden rounded-4xl border border-border bg-(--card)',
        !isOpen && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
