import { useEffect, useId, useRef, useState, type ClipboardEvent } from 'react';
import { descriptionSentenceKey } from '@shared/descriptionSentences';
import { ChevronDown, LoaderCircle, Plus } from 'lucide-react';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';

type Props = {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void;
  saveLabel: string;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
};

const iconMotion =
  'absolute inset-0 size-4 transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none';

export function DescriptionSentenceSelect({
  label,
  value,
  options,
  onChange,
  onPaste,
  saveLabel,
  canSave,
  saving,
  onSave,
}: Props) {
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
  const matches = options.filter((option) =>
    option
      .toLocaleLowerCase('de-DE')
      .includes(filter.toLocaleLowerCase('de-DE'))
  );
  const choose = (sentence: string) => {
    onChange(sentence);
    setOpen(false);
    setFilter('');
    setActive(-1);
  };
  const adding = value.trim().length > 0;
  const mode = saving ? 'saving' : adding ? 'add' : 'browse';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          ref={anchorRef}
          className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-background"
        >
          <input
            ref={inputRef}
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
            maxLength={500}
            placeholder="Satz wählen oder eigenen Text eingeben"
            className="h-8 min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            onFocus={() => {
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
            onPaste={onPaste}
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
                const selected =
                  open && active >= 0 ? matches[active] : undefined;
                const existing = options.find(
                  (option) =>
                    descriptionSentenceKey(option) ===
                    descriptionSentenceKey(value)
                );
                const sentence = selected ?? existing;
                if (sentence) {
                  choose(sentence);
                } else if (canSave && !saving) {
                  onSave();
                  setOpen(false);
                  setActive(-1);
                }
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
              }
            }}
          />
          <button
            type="button"
            aria-label={adding ? saveLabel : `${label}: Vorschläge anzeigen`}
            aria-expanded={adding ? undefined : open}
            aria-busy={saving || undefined}
            title={adding ? '+ für Hinzufügen' : undefined}
            disabled={adding && (!canSave || saving)}
            className="inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground transition-colors duration-200 hover:text-foreground disabled:opacity-40 motion-reduce:transition-none"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (adding) {
                if (canSave && !saving) onSave();
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
                className={`${iconMotion} ${mode === 'browse' ? 'scale-100 rotate-0 opacity-100' : 'scale-75 rotate-90 opacity-0'}`}
              />
              <Plus
                className={`${iconMotion} ${mode === 'add' ? 'scale-100 rotate-0 opacity-100' : mode === 'saving' ? 'scale-75 rotate-90 opacity-0' : 'scale-75 -rotate-90 opacity-0'}`}
              />
              <LoaderCircle
                className={`${iconMotion} ${mode === 'saving' ? 'scale-100 rotate-0 animate-spin opacity-100' : 'scale-75 -rotate-90 opacity-0'}`}
              />
            </span>
          </button>
        </div>
      </PopoverAnchor>
      <PopoverContent
        role="listbox"
        id={listId}
        aria-label={`${label}: Sätze`}
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
            aria-selected={option === value}
            className={`w-full rounded-md px-2 py-1.5 text-left text-sm whitespace-normal hover:bg-muted ${active === index ? 'bg-muted' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(option)}
          >
            {option}
          </button>
        ))}
        {matches.length === 0 ? (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Eigener Satz — Enter oder + zum Hinzufügen.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
