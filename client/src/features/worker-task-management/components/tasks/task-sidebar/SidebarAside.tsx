import { DrawerLayer, useDrawerStack } from '@/components/ui/drawer-stack';
import { cn } from '@/lib/trycatch';
import {
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from 'react';
import '@/components/ui/right-sidebar.css';
import { createPortal } from 'react-dom';

export type SidebarAsideProps = ComponentPropsWithoutRef<'aside'> & {
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
  const stack = useDrawerStack();
  const sidebarRef = useRef<HTMLElement>(null);
  const [hasOpened, setHasOpened] = useState(isOpen);
  if (isOpen && !hasOpened) setHasOpened(true);
  const motionState = isOpen ? 'open' : hasOpened ? 'closed' : 'idle';

  useEffect(() => {
    if (!isOpen || stack) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing)
        return;

      // Panels share a z-index, so the last open panel in DOM order is on top.
      const panels = document.querySelectorAll(
        '[data-sidebar-aside][data-state="open"]'
      );
      if (panels[panels.length - 1] !== sidebarRef.current) return;

      event.preventDefault();
      onClose();
    };

    // Bubble after controls and Radix layers have had a chance to consume Escape.
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stack]);

  if (stack) {
    return (
      <DrawerLayer
        {...props}
        open={isOpen}
        title={props['aria-label'] ?? 'Details'}
        onClose={onClose}
        showCloseButton={false}
        className={className}
        style={{
          width: 'min(32rem, 100%)',
          ...props.style,
        }}
        contentClassName="flex flex-col p-0 md:p-0"
        data-sidebar-aside=""
      >
        {children}
      </DrawerLayer>
    );
  }

  // A transformed Cockpit drawer must not become the containing block for
  // this fixed panel (including its parked, closed position).
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      {motionState !== 'idle' ? (
        <button
          type="button"
          aria-label="Schließen"
          tabIndex={-1}
          disabled={!isOpen}
          data-state={motionState}
          className="cockpit-drawer-overlay fixed inset-0 z-40 bg-black/15"
          onClick={onClose}
        />
      ) : null}
      <aside
        ref={sidebarRef}
        data-sidebar-aside=""
        aria-hidden={!isOpen}
        inert={!isOpen}
        data-state={motionState}
        className={cn(
          // Flush + square the right edge so radius never leaves a viewport strip.
          'right-sidebar fixed inset-y-0 right-0 z-50 overflow-hidden rounded-l-[26px] border border-r-0 border-border bg-(--card)',
          !isOpen && 'pointer-events-none',
          // Never-opened panels still painted a sliver on the viewport edge.
          motionState === 'idle' && 'invisible',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    </>,
    document.body
  );
}
