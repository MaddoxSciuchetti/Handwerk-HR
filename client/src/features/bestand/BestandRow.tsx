import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import TrashButton from '@/components/TrashButton';
import { useEffect, useState } from 'react';
import type { ClothingStockItem } from './bestand.api';
import { stockErrorMessage } from './stockError';
import {
  useDeleteClothingStockItem,
  useUpdateClothingStockQuantity,
} from './useBestand';

type BestandRowProps = {
  item: ClothingStockItem;
};

export function BestandRow({ item }: BestandRowProps) {
  const updateQuantity = useUpdateClothingStockQuantity();
  const deleteItem = useDeleteClothingStockItem();
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQuantity(String(item.quantity));
  }, [item.quantity]);

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
          setError(stockErrorMessage(mutationError, 'Anzahl konnte nicht gespeichert werden.'));
        },
      }
    );
  };

  return (
    <TableRow data-testid={`bestand-row-${item.id}`}>
      <TableCell className="pl-10 font-medium">{item.name}</TableCell>
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
          className="w-24"
        />
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
      <TableCell className="pr-6 text-right">
        <TrashButton
          description={`${item.name} löschen`}
          disabled={deleteItem.isPending}
          onClick={() => deleteItem.mutate(item.id)}
        />
      </TableCell>
    </TableRow>
  );
}
