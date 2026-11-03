import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, MouseEvent } from 'react';
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
};

export function StoredFileBox({
  label,
  icon: Icon,
  onOpen,
  onPrint,
  onPrefetchPrint,
  selected,
  onSelectedChange,
  className,
  ...props
}: StoredFileBoxProps) {
  const selectable = Boolean(onSelectedChange);

  return (
    <div
      className="group relative min-w-0"
      onPointerEnter={() => onPrefetchPrint?.()}
    >
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        aria-pressed={selectable ? selected : undefined}
        onClick={onOpen}
        className={cn(
          'h-full w-full flex-col items-start gap-3 rounded-xl border border-border p-4 text-left font-normal hover:bg-(--dropdown-surface) hover:text-foreground focus-visible:ring-0 focus-visible:border-muted-foreground',
          selected ? 'border-primary bg-primary/5' : null,
          className
        )}
        {...props}
      >
        <Icon className="h-8 w-8 text-muted-foreground" aria-hidden />
        <span className="block truncate text-sm font-medium">{label}</span>
      </Button>
      {selectable ? (
        <div
          className="absolute left-2 top-2 z-10"
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
      ) : null}
      {onPrint ? (
        <FilePrintButton
          label={label}
          onPrint={onPrint}
          onPrefetch={onPrefetchPrint}
          className="absolute right-2 top-2"
        />
      ) : null}
    </div>
  );
}
