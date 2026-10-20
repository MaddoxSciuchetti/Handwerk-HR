import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MouseEvent } from 'react';
import { SquareCheckIcon, SquareDashedIcon } from './SelectIcons';

type RowSelectButtonProps = {
  isSelected: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  selectedLabel?: string;
  idleLabel?: string;
};

export function RowSelectButton({
  isSelected,
  onClick,
  selectedLabel = 'Auswahl entfernen',
  idleLabel = 'Auswählen',
}: RowSelectButtonProps) {
  const SelectionIcon = isSelected ? SquareCheckIcon : SquareDashedIcon;

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
        'absolute inset-y-0 left-0 z-20 h-auto w-10 rounded-none p-0',
        'border-0 bg-transparent shadow-none hover:bg-transparent focus-visible:ring-2 dark:hover:bg-transparent',
        isSelected
          ? 'opacity-100'
          : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
      )}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 -right-2" />
      <SelectionIcon className="relative size-6" />
    </Button>
  );
}
