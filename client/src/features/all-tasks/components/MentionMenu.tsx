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
          <button
            type="button"
            role="option"
            aria-selected={index === activeIndex}
            className={
              index === activeIndex
                ? 'w-full rounded-lg bg-muted px-2 py-1.5 text-left text-sm'
                : 'w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted'
            }
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(choice.id);
            }}
          >
            {choice.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
