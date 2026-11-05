import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CLOTHING_PRINT_TYPE_LABELS } from '@shared/clothing';
import { useClothingStock, useUpdateClothingStockQuantity } from './useBestand';
import { stockErrorMessage } from './stockError';

export function BestandItemDetails({ id }: { id: string }) {
  const stock = useClothingStock();
  const item = stock.data?.find((entry) => entry.id === id);
  const update = useUpdateClothingStockQuantity();
  const [quantity, setQuantity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (stock.isLoading) return <p>Artikel wird geladen…</p>;
  if (!item)
    return (
      <p className="text-muted-foreground">
        Artikel konnte nicht geladen werden.
      </p>
    );
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        const next = Number(quantity ?? item.quantity);
        if (!Number.isInteger(next) || next < 0) {
          setError('Anzahl muss eine ganze Zahl ab 0 sein.');
          return;
        }
        setError(null);
        update.mutate(
          { id, quantity: next },
          {
            onSuccess: () => setQuantity(null),
            onError: (cause) =>
              setError(
                stockErrorMessage(
                  cause,
                  'Anzahl konnte nicht gespeichert werden.'
                )
              ),
          }
        );
      }}
    >
      <h1 className="typo-h4 font-bold">{item.name}</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
        <dt>Größe</dt>
        <dd>{item.size || '—'}</dd>
        <dt>Typ</dt>
        <dd>{CLOTHING_PRINT_TYPE_LABELS[item.printType]}</dd>
      </dl>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`stock-quantity-${id}`}>Anzahl bei BSB</Label>
        <Input
          id={`stock-quantity-${id}`}
          className="max-w-40"
          type="number"
          min={0}
          step={1}
          value={quantity ?? item.quantity}
          onChange={(event) => setQuantity(event.target.value)}
          disabled={update.isPending}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {update.isSuccess && quantity === null ? (
        <p role="status" className="text-sm text-muted-foreground">
          Anzahl gespeichert.
        </p>
      ) : null}
      <Button className="self-start" type="submit" disabled={update.isPending}>
        Speichern
      </Button>
    </form>
  );
}
