import { cn } from '@/lib/trycatch';
import { useEffect, useRef, type ComponentProps } from 'react';
import '@/components/ui/right-sidebar.css';

export type SidebarAsideProps = ComponentProps<'aside'> & {
  isOpen: boolean;
  onClose: () => void;
};

export function SidebarAside({
  className,
  isOpen,
  onClose,
  children,
  ...props
}: SidebarAsideProps) {
  const hasOpened = useRef(isOpen);
  const onCloseRef = useRef(onClose);
  if (isOpen) hasOpened.current = true;
  onCloseRef.current = onClose;
  const motionState = isOpen ? 'open' : hasOpened.current ? 'closed' : 'idle';

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

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
