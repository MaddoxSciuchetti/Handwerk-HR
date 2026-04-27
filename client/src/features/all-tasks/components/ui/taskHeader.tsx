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
      className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--neutral-200)] p-0.5"
      role="group"
      aria-label="Ansicht umschalten"
    >
      <button
        type="button"
        onClick={() => onChange('left')}
        className={
          value === 'left'
            ? 'flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-page)] px-4 py-2 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] text-sm text-black'
            : 'flex h-9 shrink-0 items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm text-black'
        }
      >
        Alle Aufgaben
      </button>
      <button
        type="button"
        onClick={() => onChange('right')}
        className={
          value === 'right'
            ? 'flex h-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-page)] px-4 py-2 shadow-[0px_2px_4px_0px_rgba(0,0,0,0.25)] text-sm text-black'
            : 'flex h-9 shrink-0 items-center justify-center rounded-full bg-transparent px-4 py-2 text-sm text-black'
        }
      >
        Meine Aufgaben
      </button>
    </div>
  );
}
