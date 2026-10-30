import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { CLOTHING_PRINT_TYPE_LABELS } from '@shared/clothing';
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

function sizeLabel(size: string) {
  return size || '—';
}

export function BestandRow({
  item,
  isSelected,
  onToggle,
  selectionDisabled,
}: BestandRowProps) {
  const updateQuantity = useUpdateClothingStockQuantity();
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
  const typeLabel = CLOTHING_PRINT_TYPE_LABELS[item.printType];
  const selectionName = `${item.name} (${sizeLabel(item.size)}, ${typeLabel})`;

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
        <div className="absolute inset-y-0 left-0 z-20 flex w-10 items-center justify-center">
          <Checkbox
            checked={isSelected}
            disabled={selectionDisabled}
            aria-label={
              isSelected
                ? `${selectionName} aus der Auswahl entfernen`
                : `${selectionName} auswählen`
            }
            onClick={() => onToggle(item.id)}
            className="relative cursor-pointer after:absolute after:-inset-3 after:content-['']"
          />
        </div>
        {item.name}
      </TableCell>
      <TableCell>{sizeLabel(item.size)}</TableCell>
      <TableCell>{typeLabel}</TableCell>
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
