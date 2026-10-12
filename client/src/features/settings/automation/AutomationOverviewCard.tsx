import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type AutomationOverviewCardProps = {
  name: string;
  description: string;
  status?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function AutomationOverviewCard({
  name,
  description,
  status,
  children,
  className,
}: AutomationOverviewCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-2xl border border-border bg-card px-4 py-4',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="typo-body-sm font-medium text-text-primary">{name}</h2>
          <p className="typo-body-xs text-text-secondary">{description}</p>
        </div>
        {status ? <div className="shrink-0">{status}</div> : null}
      </div>
      {children}
    </section>
  );
}
