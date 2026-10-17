import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

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
    <ToggleGroup
      type="single"
      value={value}
      spacing={1}
      aria-label="Ansicht umschalten"
      className="shrink-0 gap-0.5 rounded-full bg-muted p-0.5"
      onValueChange={(next) => {
        if (next === 'left' || next === 'right') onChange(next);
      }}
    >
      <ToggleGroupItem
        value="left"
        className="h-7 shrink-0 rounded-full border-0 bg-transparent px-3 text-xs font-medium text-foreground shadow-none hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.12)] dark:data-[state=on]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.4)]"
      >
        Alle Aufgaben
      </ToggleGroupItem>
      <ToggleGroupItem
        value="right"
        className="h-7 shrink-0 rounded-full border-0 bg-transparent px-3 text-xs font-medium text-foreground shadow-none hover:bg-transparent hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.12)] dark:data-[state=on]:shadow-[0px_1px_3px_0px_rgba(0,0,0,0.4)]"
      >
        Meine Aufgaben
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
