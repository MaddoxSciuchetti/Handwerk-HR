import { Checkbox } from '@/components/ui/checkbox';
import type { MouseEvent } from 'react';

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
  return (
    <div
      data-row-select=""
      className="absolute inset-y-0 left-0 z-20 flex w-10 items-center justify-center"
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
