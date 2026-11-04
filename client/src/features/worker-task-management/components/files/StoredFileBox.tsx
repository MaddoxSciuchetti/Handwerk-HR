import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PopoverAnchor } from '@/components/ui/popover';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { FilePrintButton } from './FilePrintButton';
import { cn } from '@/lib/utils';

type StoredFileBoxProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
  onPrint?: () => Promise<void>;
  onPrefetchPrint?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  selectionAnchor?: boolean;
};

function CheckboxHost({
  anchor,
  children,
}: {
  anchor?: boolean;
  children: ReactNode;
}) {
  if (anchor) {
    return <PopoverAnchor asChild>{children}</PopoverAnchor>;
  }
  return children;
}

function topActionPadding(
  selectable: boolean,
  printable: boolean,
  deletable: boolean
) {
  const count = Number(selectable) + Number(printable) + Number(deletable);
  if (count >= 3) return 'pr-20';
  if (count === 2) return 'pr-16';
  if (count === 1) return 'pr-12';
  return null;
}

export function StoredFileBox({
  label,
  icon: Icon,
  onOpen,
  onPrint,
  onPrefetchPrint,
  onDelete,
  deleting,
  selected,
  onSelectedChange,
  selectionAnchor,
  className,
  ...props
}: StoredFileBoxProps) {
  const selectable = Boolean(onSelectedChange);
  const printable = Boolean(onPrint);
  const deletable = Boolean(onDelete);
  const hasTopActions = selectable || printable || deletable;

  return (
    <div
      className="group relative min-w-0 overflow-hidden"
      onPointerEnter={() => onPrefetchPrint?.()}
    >
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        aria-pressed={selectable ? selected : undefined}
        onClick={onOpen}
        className={cn(
          'h-auto w-full min-w-0 flex-col items-start gap-2 overflow-hidden rounded-xl border border-border p-3 text-left font-normal hover:bg-(--dropdown-surface) hover:text-foreground focus-visible:ring-0 focus-visible:border-muted-foreground',
          topActionPadding(selectable, printable, deletable),
          selected ? 'border-primary bg-primary/5' : null,
          className
        )}
        {...props}
      >
        <Icon className="h-6 w-6 shrink-0 text-muted-foreground" aria-hidden />
        <span className="block w-full min-w-0 truncate text-sm font-medium">
          {label}
        </span>
      </Button>
      {hasTopActions ? (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
          {selectable ? (
            <CheckboxHost anchor={selectionAnchor}>
              <div
                data-template-file-select=""
                onClick={(event: MouseEvent) => event.stopPropagation()}
              >
                <Checkbox
                  checked={Boolean(selected)}
                  aria-label={
                    selected
                      ? `${label} aus der Auswahl entfernen`
                      : `${label} auswählen`
                  }
                  onCheckedChange={(checked) =>
                    onSelectedChange?.(checked === true)
                  }
                  className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
                />
              </div>
            </CheckboxHost>
          ) : null}
          {printable ? (
            <FilePrintButton
              label={label}
              onPrint={onPrint!}
              onPrefetch={onPrefetchPrint}
            />
          ) : null}
          {deletable ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              disabled={deleting}
              draggable={false}
              aria-label={`${label} löschen`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              className="cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
