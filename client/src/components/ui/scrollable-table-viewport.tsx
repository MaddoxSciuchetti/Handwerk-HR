import { cn } from '@/lib/utils';
import { useRef, type ReactNode, type UIEvent } from 'react';

type ScrollableTableViewportProps = {
  children: ReactNode;
  className?: string;
  onScrolledChange?: (scrolled: boolean) => void;
};

/**
 * Apply on each sticky `th`.
 * Opaque white fill + high z-index so scrolled rows cannot show through.
 */
export function stickyTableHeadClassName(scrolled = false) {
  return cn(
    'sticky top-0 z-30 isolate bg-[var(--card)] transition-shadow',
    scrolled && 'shadow-[inset_0_-1px_0_0_var(--border)]'
  );
}

export function ScrollableTableViewport({
  children,
  className,
  onScrolledChange,
}: ScrollableTableViewportProps) {
  const scrolledRef = useRef(false);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const next = event.currentTarget.scrollTop > 0;
    if (scrolledRef.current === next) return;
    scrolledRef.current = next;
    event.currentTarget.toggleAttribute('data-scrolled', next);
    onScrolledChange?.(next);
  };

  return (
    <div
      className={cn('min-h-0 flex-1 overflow-auto', className)}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}
