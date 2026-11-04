import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PopoverAnchor } from '@/components/ui/popover';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';
import { FilePrintButton } from './FilePrintButton';
import { cn } from '@/lib/utils';

type StoredFileBoxProps = Omit<ComponentProps<'button'>, 'children'> & {
  label: string;
  icon: LucideIcon;
  onOpen: () => void;
  onPrint?: () => Promise<void>;
  onPrefetchPrint?: () => void;
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

export function StoredFileBox({
  label,
  icon: Icon,
  onOpen,
  onPrint,
  onPrefetchPrint,
  selected,
  onSelectedChange,
  selectionAnchor,
  className,
  ...props
}: StoredFileBoxProps) {
  const selectable = Boolean(onSelectedChange);
  const hasTopActions = selectable || Boolean(onPrint);

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
          selectable && onPrint ? 'pr-16' : hasTopActions ? 'pr-12' : null,
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
          {onPrint ? (
            <FilePrintButton
              label={label}
              onPrint={onPrint}
              onPrefetch={onPrefetchPrint}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
