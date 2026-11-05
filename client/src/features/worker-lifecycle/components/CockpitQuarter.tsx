import type { ReactNode } from 'react';

type CockpitQuarterProps = {
  title: string;
  children: ReactNode;
};

/** One equal panel in the large-desktop Cockpit 2×2 layout. */
export function CockpitQuarter({ title, children }: CockpitQuarterProps) {
  return (
    <section
      aria-label={title}
      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-background"
    >
      <div className="min-h-0 flex-1 overflow-auto p-2 [&_>div]:mx-0 [&_>div]:h-auto [&_>div]:min-h-0 [&_>div]:max-w-none [&_>div]:rounded-none [&_>div]:bg-transparent [&_>div]:p-0">
        {children}
      </div>
    </section>
  );
}
