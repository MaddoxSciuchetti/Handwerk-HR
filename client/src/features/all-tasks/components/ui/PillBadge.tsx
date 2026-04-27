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
        'ds-label-sm flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--border-brand)] bg-primary px-4 text-sm text-primary-foreground',
        className
      )}
    >
      {children}
    </div>
  );
}
