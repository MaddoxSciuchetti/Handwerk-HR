import { cn } from '@/lib/trycatch';
import { useRef, type ComponentProps } from 'react';
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
  const hasOpened = useRef(isOpen);
  if (isOpen) hasOpened.current = true;
  const motionState = isOpen ? 'open' : hasOpened.current ? 'closed' : 'idle';

  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      data-state={motionState}
      className={cn(
        'right-sidebar fixed right-1 top-1 bottom-1 z-50 overflow-hidden rounded-4xl border border-border bg-(--card)',
        !isOpen && 'pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
