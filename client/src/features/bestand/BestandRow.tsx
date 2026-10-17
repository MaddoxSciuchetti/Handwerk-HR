import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  SquareCheckIcon,
  SquareDashedIcon,
} from '@/features/all-tasks/components/ui/SelectIcons';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { ClothingStockItem } from './bestand.api';
import { stockErrorMessage } from './stockError';
import { useUpdateClothingStockQuantity } from './useBestand';

type BestandRowProps = {
  item: ClothingStockItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  selectionDisabled?: boolean;
};

export function BestandRow({
  item,
  isSelected,
  onToggle,
  selectionDisabled,
}: BestandRowProps) {
  const updateQuantity = useUpdateClothingStockQuantity();
  const SelectionIcon = isSelected ? SquareCheckIcon : SquareDashedIcon;
  const [draft, setDraft] = useState({
    source: item.quantity,
    value: String(item.quantity),
  });
  if (draft.source !== item.quantity) {
    setDraft({ source: item.quantity, value: String(item.quantity) });
  }
  const quantity = draft.value;
  const setQuantity = (value: string) =>
    setDraft({ source: item.quantity, value });
  const [error, setError] = useState<string | null>(null);

  const commitQuantity = () => {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setQuantity(String(item.quantity));
      setError('Anzahl muss eine ganze Zahl ab 0 sein.');
      return;
    }
    if (parsed === item.quantity) return;

    setError(null);
    updateQuantity.mutate(
      { id: item.id, quantity: parsed },
      {
        onError: (mutationError) => {
          setQuantity(String(item.quantity));
          setError(
            stockErrorMessage(
              mutationError,
              'Anzahl konnte nicht gespeichert werden.'
            )
          );
        },
      }
    );
  };

  return (
    <TableRow
      data-testid={`bestand-row-${item.id}`}
      data-selected={isSelected ? 'true' : undefined}
      className="group border-0 hover:bg-transparent"
    >
      <TableCell className="relative font-medium">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `${item.name} (${item.size || '—'}) aus der Auswahl entfernen`
              : `${item.name} (${item.size || '—'}) auswählen`
          }
          disabled={selectionDisabled}
          onClick={() => onToggle(item.id)}
          className={cn(
            'absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl',
            isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
          )}
        >
          <SelectionIcon className="size-4" />
        </Button>
        {item.name}
      </TableCell>
      <TableCell>{item.size || '—'}</TableCell>
      <TableCell>
        <Input
          aria-label={`Anzahl bei BSB für ${item.name}`}
          type="number"
          min={0}
          step={1}
          value={quantity}
          disabled={updateQuantity.isPending}
          onChange={(event) => setQuantity(event.target.value)}
          onBlur={commitQuantity}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
          className="w-24 shadow-none focus-visible:border-border focus-visible:ring-0"
        />
        {error ? (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        ) : null}
      </TableCell>
    </TableRow>
  );
}
