import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type ScrollableTableViewportProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollableTableViewport({
  children,
  className,
}: ScrollableTableViewportProps) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto', className)}>
      {children}
    </div>
  );
}
