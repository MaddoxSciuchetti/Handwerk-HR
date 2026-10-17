import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState } from 'react';
import { stockErrorMessage } from './stockError';
import { useCreateClothingStockItem } from './useBestand';

export function BestandAddForm() {
  const createItem = useCreateClothingStockItem();
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      setError('Anzahl muss eine ganze Zahl ab 0 sein.');
      return;
    }

    setError(null);
    createItem.mutate(
      { name: name.trim(), size: size.trim(), quantity: parsedQuantity },
      {
        onSuccess: () => {
          setName('');
          setSize('');
          setQuantity('1');
        },
        onError: (mutationError) => {
          setError(
            stockErrorMessage(mutationError, 'Artikel konnte nicht gespeichert werden.')
          );
        },
      }
    );
  };

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={handleSubmit}
      data-testid="bestand-add-form"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="bestand-name">Artikel</Label>
        <Input
          id="bestand-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="z. B. Hose"
          required
          className="w-44"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bestand-size">Größe</Label>
        <Input
          id="bestand-size"
          value={size}
          onChange={(event) => setSize(event.target.value)}
          placeholder="z. B. 52"
          className="w-28"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="bestand-quantity">Anzahl bei BSB</Label>
        <Input
          id="bestand-quantity"
          type="number"
          min={0}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
          className="w-28"
        />
      </div>
      <Button type="submit" className="rounded-2xl" disabled={createItem.isPending}>
        Hinzufügen
      </Button>
      {error ? (
        <p className="basis-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
