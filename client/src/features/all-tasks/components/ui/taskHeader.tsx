export function TaskHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex grow items-left">Aufgaben</div>
      <div></div>
    </div>
  );
}

export type Segment = 'left' | 'right';

export function TaskSegmentToggle({
  value,
  onChange,
}: {
  value: Segment;
  onChange: (next: Segment) => void;
}) {
  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-muted p-0.5"
      role="group"
      aria-label="Ansicht umschalten"
    >
      <button
        type="button"
        onClick={() => onChange('left')}
        className={
          value === 'left'
            ? 'flex h-7 shrink-0 items-center justify-center rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-[0px_1px_3px_0px_rgba(0,0,0,0.12)] dark:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.4)]'
            : 'flex h-7 shrink-0 items-center justify-center rounded-full bg-transparent px-3 py-1 text-xs font-medium text-foreground'
        }
      >
        Alle Aufgaben
      </button>
      <button
        type="button"
        onClick={() => onChange('right')}
        className={
          value === 'right'
            ? 'flex h-7 shrink-0 items-center justify-center rounded-full bg-background px-3 py-1 text-xs font-medium text-foreground shadow-[0px_1px_3px_0px_rgba(0,0,0,0.12)] dark:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.4)]'
            : 'flex h-7 shrink-0 items-center justify-center rounded-full bg-transparent px-3 py-1 text-xs font-medium text-foreground'
        }
      >
        Meine Aufgaben
      </button>
    </div>
  );
}
