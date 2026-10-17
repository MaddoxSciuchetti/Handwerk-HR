import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import TrashButton from '@/components/TrashButton';
import { useEffect, useState } from 'react';
import type { EngagementClothingItem } from '../../api/engagementClothing.api';

type ClothingOrderRowProps = {
  item: EngagementClothingItem;
  returning: boolean;
  deleting: boolean;
  onReturn: (quantity: number) => Promise<unknown>;
  onDelete: () => void;
};

const sourceLabel = {
  storage: 'Aus Bestand',
  purchased: 'Neu gekauft',
} as const;

export function ClothingOrderRow({
  item,
  returning,
  deleting,
  onReturn,
  onDelete,
}: ClothingOrderRowProps) {
  const outstanding = item.quantity - item.returnedQuantity;
  const [amount, setAmount] = useState(String(Math.max(outstanding, 1)));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(String(Math.max(outstanding, 1)));
  }, [outstanding]);

  const handleReturn = async () => {
    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > outstanding) {
      setError(`Anzahl zwischen 1 und ${outstanding}.`);
      return;
    }
    setError(null);
    try {
      await onReturn(parsed);
    } catch (returnError) {
      const message =
        returnError &&
        typeof returnError === 'object' &&
        'message' in returnError &&
        typeof returnError.message === 'string'
          ? returnError.message
          : 'Rückgabe konnte nicht gespeichert werden.';
      setError(message);
    }
  };

  return (
    <TableRow data-testid={`clothing-row-${item.id}`}>
      <TableCell className="pl-10 font-medium">{item.name}</TableCell>
      <TableCell>{item.size || '—'}</TableCell>
      <TableCell>
        {item.productUrl ? (
          <a
            href={item.productUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm underline underline-offset-2"
          >
            Link
          </a>
        ) : (
          '—'
        )}
      </TableCell>
      <TableCell>{sourceLabel[item.source]}</TableCell>
      <TableCell>{item.quantity}</TableCell>
      <TableCell>
        {outstanding < 1 ? (
          <span>Zurück im Bestand</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {outstanding > 1 ? (
              <Input
                aria-label={`Rückgabe für ${item.name}`}
                type="number"
                min={1}
                max={outstanding}
                step={1}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="w-20"
              />
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-2xl"
              disabled={returning}
              onClick={handleReturn}
            >
              Zurückgeben
            </Button>
          </div>
        )}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
      <TableCell className="pr-6 text-right">
        <TrashButton
          description={`${item.name} entfernen`}
          disabled={deleting}
          onClick={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
