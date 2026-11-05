import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { CockpitSection } from './cockpitSections';

type CockpitSectionCardProps = {
  section: CockpitSection;
  onOpen: () => void;
};

export function CockpitSectionCard({
  section,
  onOpen,
}: CockpitSectionCardProps) {
  const Icon = section.icon;

  return (
    <button
      type="button"
      // Pointer activation should not leave a focus highlight on the card.
      // Keyboard activation still uses the focus-visible ring.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onOpen}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left outline-none transition-colors',
        'hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {section.title}
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </button>
  );
}
