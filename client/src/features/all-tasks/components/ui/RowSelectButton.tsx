import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { MouseEvent } from 'react';
import { SquareCheckIcon, SquareIcon } from './SelectIcons';

type RowSelectButtonProps = {
  isSelected: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  selectedLabel?: string;
  idleLabel?: string;
  alwaysVisible?: boolean;
  compact?: boolean;
};

export function RowSelectButton({
  isSelected,
  onClick,
  selectedLabel = 'Auswahl entfernen',
  idleLabel = 'Auswählen',
  alwaysVisible = false,
  compact = false,
}: RowSelectButtonProps) {
  const SelectionIcon = isSelected ? SquareCheckIcon : SquareIcon;

  if (compact) {
    return (
      <div
        data-row-select=""
        className={cn(
          'absolute inset-y-0 left-0 z-20 flex w-10 items-center justify-center',
          !isSelected && !alwaysVisible &&
            'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
        )}
      >
        <Checkbox
          checked={isSelected}
          aria-label={isSelected ? selectedLabel : idleLabel}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={onClick}
          className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
        />
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      data-row-select=""
      aria-pressed={isSelected}
      aria-label={isSelected ? selectedLabel : idleLabel}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onClick}
      className={cn(
        'absolute inset-y-0 left-0 z-20 h-auto w-10 rounded-none p-0 transition-none active:not-aria-[haspopup]:translate-y-0',
        'border-0 bg-transparent shadow-none hover:bg-transparent focus-visible:ring-2 dark:hover:bg-transparent',
        isSelected || alwaysVisible
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 -right-2" />
      <SelectionIcon className="relative size-[1.215rem]" />
    </Button>
  );
}
