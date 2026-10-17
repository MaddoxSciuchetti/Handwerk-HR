import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import { FormEvent, useEffect, useState } from 'react';
import { stockErrorMessage } from './stockError';
import { useCreateClothingStockItem } from './useBestand';

type BestandAddFormProps = {
  open: boolean;
  onAdded: () => void;
};

export function BestandAddForm({ open, onAdded }: BestandAddFormProps) {
  const createItem = useCreateClothingStockItem();
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setName('');
    setSize('');
    setQuantity('1');
    setError(null);
  }, [open]);

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
        onSuccess: () => onAdded(),
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
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      onSubmit={handleSubmit}
      data-testid="bestand-add-form"
    >
      <SidebarContent className="mt-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
        <div className="grid gap-1.5">
          <Label htmlFor="bestand-name">Artikel</Label>
          <Input
            id="bestand-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bestand-size">Größe</Label>
          <Input
            id="bestand-size"
            value={size}
            onChange={(event) => setSize(event.target.value)}
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
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="shrink-0 border-0 p-6">
        <Button type="submit" className="rounded-2xl" disabled={createItem.isPending}>
          Hinzufügen
        </Button>
      </SidebarFooter>
    </form>
  );
}
