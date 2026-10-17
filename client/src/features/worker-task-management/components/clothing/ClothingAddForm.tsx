import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClothingStockItem } from '@/features/bestand/bestand.api';
import { FormEvent, useState } from 'react';
import type { CreateEngagementClothingInput } from '../../api/engagementClothing.api';

const PURCHASED = 'purchased';

type ClothingAddFormProps = {
  stock: ClothingStockItem[];
  pending: boolean;
  onAdd: (input: CreateEngagementClothingInput) => Promise<unknown>;
};

function stockLabel(item: ClothingStockItem) {
  const size = item.size || 'ohne Größe';
  return `${item.name} · ${size} · ${item.quantity} im Bestand`;
}

export function ClothingAddForm({ stock, pending, onAdd }: ClothingAddFormProps) {
  const available = stock.filter((item) => item.quantity > 0);
  const [choice, setChoice] = useState(PURCHASED);
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  const selectedStock =
    choice === PURCHASED ? null : available.find((item) => item.id === choice) ?? null;
  const fromStorage = selectedStock !== null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError('Anzahl muss eine ganze Zahl ab 1 sein.');
      return;
    }
    if (fromStorage && parsedQuantity > selectedStock.quantity) {
      setError('Nicht genug Bestand.');
      return;
    }
    if (!fromStorage && !name.trim()) {
      setError('Artikel fehlt.');
      return;
    }

    const input: CreateEngagementClothingInput = fromStorage
      ? {
          stockItemId: selectedStock.id,
          quantity: parsedQuantity,
          ...(productUrl.trim() ? { productUrl: productUrl.trim() } : {}),
        }
      : {
          name: name.trim(),
          size: size.trim(),
          quantity: parsedQuantity,
          ...(productUrl.trim() ? { productUrl: productUrl.trim() } : {}),
        };

    setError(null);
    try {
      await onAdd(input);
      setChoice(PURCHASED);
      setName('');
      setSize('');
      setProductUrl('');
      setQuantity('1');
    } catch (submitError) {
      const message =
        submitError &&
        typeof submitError === 'object' &&
        'message' in submitError &&
        typeof submitError.message === 'string'
          ? submitError.message
          : 'Kleidung konnte nicht gespeichert werden.';
      setError(message);
    }
  };

  return (
    <form
      className="mb-6 flex flex-wrap items-end gap-3"
      onSubmit={handleSubmit}
      data-testid="clothing-add-form"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="clothing-source">Artikel</Label>
        <Select
          value={fromStorage || choice === PURCHASED ? choice : PURCHASED}
          onValueChange={setChoice}
        >
          <SelectTrigger id="clothing-source" className="w-64">
            <SelectValue placeholder="Artikel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={PURCHASED}>Neu gekauft</SelectItem>
            {available.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {stockLabel(item)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {fromStorage ? null : (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="clothing-name">Bezeichnung</Label>
            <Input
              id="clothing-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Schuhe"
              required
              className="w-44"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="clothing-size">Größe</Label>
            <Input
              id="clothing-size"
              value={size}
              onChange={(event) => setSize(event.target.value)}
              placeholder="z. B. 43"
              className="w-28"
            />
          </div>
        </>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="clothing-quantity">Anzahl</Label>
        <Input
          id="clothing-quantity"
          type="number"
          min={1}
          max={fromStorage ? selectedStock.quantity : undefined}
          step={1}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
          className="w-24"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="clothing-link">Link</Label>
        <Input
          id="clothing-link"
          type="url"
          value={productUrl}
          onChange={(event) => setProductUrl(event.target.value)}
          placeholder="https://"
          className="w-56"
        />
      </div>
      <Button type="submit" className="rounded-2xl" disabled={pending}>
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
