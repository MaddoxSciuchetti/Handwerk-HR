import { cn } from '@/lib/trycatch';
import { ReactNode } from 'react';

export function PillBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex h-7 min-h-7 shrink-0 items-center justify-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium text-card-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}
