import { Button } from '@/components/ui/button';

type MentionChoice = {
  id: string;
  label: string;
};

type MentionMenuProps = {
  choices: MentionChoice[];
  activeIndex: number;
  onSelect: (id: string) => void;
};

export function MentionMenu({
  choices,
  activeIndex,
  onSelect,
}: MentionMenuProps) {
  if (!choices.length) return null;

  return (
    <ul
      role="listbox"
      aria-label="Mitarbeiter"
      className="absolute bottom-full z-20 mb-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-md"
    >
      {choices.map((choice, index) => (
        <li key={choice.id}>
          <Button
            type="button"
            variant="ghost"
            role="option"
            aria-selected={index === activeIndex}
            className={
              index === activeIndex
                ? 'h-auto w-full justify-start rounded-lg bg-muted px-2 py-1.5 text-left text-sm font-normal text-foreground hover:bg-muted hover:text-foreground'
                : 'h-auto w-full justify-start rounded-lg bg-transparent px-2 py-1.5 text-left text-sm font-normal text-foreground hover:bg-muted hover:text-foreground'
            }
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(choice.id);
            }}
          >
            {choice.label}
          </Button>
        </li>
      ))}
    </ul>
  );
}
