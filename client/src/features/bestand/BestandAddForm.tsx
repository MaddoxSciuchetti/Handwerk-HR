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
import SidebarContent from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarContent';
import SidebarFooter from '@/features/worker-task-management/components/tasks/task-sidebar/SidebarFooter';
import {
  CLOTHING_PRINT_TYPES,
  CLOTHING_PRINT_TYPE_LABELS,
  CLOTHING_SIZES,
  type ClothingPrintType,
} from '@shared/clothing';
import { FormEvent, useEffect, useState } from 'react';
import { stockErrorMessage } from './stockError';
import { useCreateClothingStockItem } from './useBestand';

type BestandAddFormProps = {
  open: boolean;
  onAdded: () => void;
};

const NO_SIZE = '__none__';

export function BestandAddForm({ open, onAdded }: BestandAddFormProps) {
  const createItem = useCreateClothingStockItem();
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [printType, setPrintType] = useState<ClothingPrintType>('bedruckt');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) return;
    setName('');
    setSize('');
    setPrintType('bedruckt');
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
      {
        name: name.trim(),
        size: size.trim(),
        printType,
        quantity: parsedQuantity,
      },
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
          <Label htmlFor="bestand-name">Beschreibung</Label>
          <Input
            id="bestand-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bestand-size">Größe</Label>
          <Select
            value={size || NO_SIZE}
            onValueChange={(value) => setSize(value === NO_SIZE ? '' : value)}
          >
            <SelectTrigger id="bestand-size" className="w-full">
              <SelectValue placeholder="Größe wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_SIZE}>ohne Größe</SelectItem>
              {CLOTHING_SIZES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bestand-type">Typ</Label>
          <Select
            value={printType}
            onValueChange={(value) => setPrintType(value as ClothingPrintType)}
          >
            <SelectTrigger id="bestand-type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_PRINT_TYPES.map((option) => (
                <SelectItem key={option} value={option}>
                  {CLOTHING_PRINT_TYPE_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
