import { cn } from '@/lib/utils';
import { useRef, type ReactNode, type UIEvent } from 'react';

type ScrollableTableViewportProps = {
  children: ReactNode;
  className?: string;
  onScrolledChange?: (scrolled: boolean) => void;
};

export function stickyTableHeaderClassName(scrolled: boolean) {
  return cn(
    'sticky top-0 z-10 transition-colors [&_th]:transition-colors',
    scrolled
      ? 'bg-muted [&_th]:bg-muted'
      : 'bg-card [&_th]:bg-card'
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
