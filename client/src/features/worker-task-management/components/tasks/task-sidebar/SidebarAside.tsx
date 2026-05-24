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
      aria-hidden={!isOpen}
      className={cn(
        'fixed right-1 top-1 bottom-1 z-50 overflow-hidden rounded-4xl border border-border bg-(--card) transition-all duration-300 ease-out',
        isOpen
          ? 'w-110 opacity-100'
          : 'w-0 max-w-0 pointer-events-none opacity-0',
        className,
        !isOpen && '!min-w-0 !max-w-0 !border-0 !p-0'
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
