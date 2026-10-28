import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

type DocumentKindSelectProps = {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  onCreate: (value: string) => void;
};

function kindKey(value: string) {
  return value.trim().toLocaleLowerCase('de');
}

export function DocumentKindSelect({
  id,
  label,
  value,
  options,
  onChange,
  onCreate,
}: DocumentKindSelectProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && active >= 0) {
      document.getElementById(`${listId}-${active}`)?.scrollIntoView?.({
        block: 'nearest',
      });
    }
  }, [open, active, listId]);

  const query = filter.trim().toLocaleLowerCase('de');
  const matches =
    query.length === 0
      ? [...options]
      : options.filter((option) =>
          option.toLocaleLowerCase('de').includes(query)
        );
  const trimmed = value.trim();
  const canCreate =
    trimmed.length > 0 &&
    !options.some((option) => kindKey(option) === kindKey(trimmed));
  const mode = canCreate ? 'add' : 'browse';

  const choose = (kind: string) => {
    onChange(kind);
    setOpen(false);
    setFilter('');
    setActive(-1);
  };

  const create = () => {
    if (!canCreate) return;
    onCreate(trimmed);
    setOpen(false);
    setFilter('');
    setActive(-1);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            className="flex min-w-0 items-center rounded-md border border-input bg-background"
          >
            <input
              ref={inputRef}
              id={id}
              role="combobox"
              aria-label={label}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && active >= 0 && active < matches.length
                  ? `${listId}-${active}`
                  : undefined
              }
              value={value}
              maxLength={80}
              placeholder="Art wählen oder eingeben"
              className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
              onFocus={() => {
                setFilter('');
                setActive(-1);
                setOpen(true);
              }}
              onClick={() => {
                setFilter('');
                setActive(-1);
                setOpen(true);
              }}
              onChange={(event) => {
                onChange(event.target.value);
                setFilter(event.target.value);
                setActive(-1);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (
                  event.key === 'ArrowDown' ||
                  event.key === 'ArrowUp' ||
                  (event.key === 'Tab' && open && matches.length > 0)
                ) {
                  event.preventDefault();
                  setOpen(true);
                  const backwards = event.key === 'ArrowUp' || event.shiftKey;
                  setActive((current) =>
                    matches.length === 0
                      ? -1
                      : !backwards
                        ? (current + 1) % matches.length
                        : current <= 0
                          ? matches.length - 1
                          : current - 1
                  );
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  if (event.repeat) return;
                  const selected =
                    open && active >= 0 ? matches[active] : undefined;
                  const existing = options.find(
                    (option) => kindKey(option) === kindKey(value)
                  );
                  if (selected) {
                    choose(selected);
                  } else if (existing) {
                    choose(existing);
                  } else if (canCreate) {
                    create();
                  }
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
            />
            <button
              type="button"
              aria-label={
                canCreate
                  ? `„${trimmed}“ hinzufügen`
                  : `${label}: Vorschläge anzeigen`
              }
              aria-expanded={canCreate ? undefined : open}
              title={canCreate ? '+ für Hinzufügen' : undefined}
              disabled={canCreate ? false : undefined}
              className="inline-flex size-9 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (canCreate) {
                  create();
                  return;
                }
                const nextOpen = !open;
                inputRef.current?.focus();
                setFilter('');
                setActive(-1);
                setOpen(nextOpen);
              }}
            >
              <span aria-hidden="true" className="relative size-4">
                <ChevronDown
                  className={`absolute inset-0 size-4 transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    mode === 'browse'
                      ? 'scale-100 rotate-0 opacity-100'
                      : 'scale-75 rotate-90 opacity-0'
                  }`}
                />
                <Plus
                  className={`absolute inset-0 size-4 transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    mode === 'add'
                      ? 'scale-100 rotate-0 opacity-100'
                      : 'scale-75 -rotate-90 opacity-0'
                  }`}
                />
              </span>
            </button>
          </div>
        </PopoverAnchor>
        <PopoverContent
          role="listbox"
          id={listId}
          aria-label={`${label}: Arten`}
          align="start"
          className="z-[100] max-h-60 w-[var(--radix-popover-trigger-width)] min-w-64 max-w-[calc(100vw-2rem)] gap-0 overflow-y-auto p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onInteractOutside={(event) => {
            if (anchorRef.current?.contains(event.target as Node))
              event.preventDefault();
          }}
        >
          {matches.map((option, index) => (
            <button
              key={option}
              type="button"
              role="option"
              tabIndex={-1}
              id={`${listId}-${index}`}
              aria-selected={kindKey(option) === kindKey(value)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-sm whitespace-normal hover:bg-muted ${
                active === index ? 'bg-muted' : ''
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              {option}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={false}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={create}
            >
              {`„${trimmed}“ hinzufügen`}
            </button>
          ) : null}
          {matches.length === 0 && !canCreate ? (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Art eingeben — Enter oder + zum Hinzufügen.
            </p>
          ) : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
