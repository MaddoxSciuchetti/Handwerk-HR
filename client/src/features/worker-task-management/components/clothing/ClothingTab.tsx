import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { stockErrorMessage } from '@/features/bestand/stockError';
import { useClothingStock } from '@/features/bestand/useBestand';
import { useState } from 'react';
import {
  useCreateEngagementClothing,
  useDeleteEngagementClothing,
  useEngagementClothing,
  useReturnEngagementClothing,
} from '../../hooks/useEngagementClothing';
import { MaterialsEngagementPicker } from '../materials/MaterialsEngagementPicker';
import { ClothingAddForm } from './ClothingAddForm';
import { ClothingOrderTable } from './ClothingOrderTable';

type ClothingTabProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
};

export function ClothingTab({ workerId, engagements }: ClothingTabProps) {
  const [engagementId, setEngagementId] = useState<string | null>(
    engagements[0]?.id ?? null
  );
  const selectedId =
    engagementId && engagements.some((item) => item.id === engagementId)
      ? engagementId
      : (engagements[0]?.id ?? null);

  const clothing = useEngagementClothing(workerId, selectedId);
  const stock = useClothingStock();
  const createItem = useCreateEngagementClothing(workerId, selectedId);
  const returnItem = useReturnEngagementClothing(workerId, selectedId);
  const removeItem = useDeleteEngagementClothing(workerId, selectedId);

  if (!selectedId) {
    return <p className="text-sm text-muted-foreground">Kein Engagement vorhanden.</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-4" data-testid="clothing-tab">
      <MaterialsEngagementPicker
        engagements={engagements}
        value={selectedId}
        onChange={setEngagementId}
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Bestellte Kleidung für den Handwerker. Ein Artikel aus dem Bestand
        reduziert den Bestand. Zurückgegebene Artikel kommen wieder in den Bestand.
      </p>
      <ClothingAddForm
        stock={stock.data ?? []}
        pending={createItem.isPending}
        onAdd={(input) => createItem.mutateAsync(input)}
      />
      {clothing.isLoading ? (
        <p className="text-sm text-muted-foreground">Kleidung wird geladen…</p>
      ) : null}
      {clothing.isError ? (
        <p className="text-sm text-destructive">Kleidung konnte nicht geladen werden.</p>
      ) : null}
      {removeItem.isError ? (
        <p className="mb-4 text-sm text-destructive">
          {stockErrorMessage(removeItem.error, 'Kleidung konnte nicht entfernt werden.')}
        </p>
      ) : null}
      {clothing.data ? (
        <ClothingOrderTable
          items={clothing.data}
          returningId={
            returnItem.isPending ? returnItem.variables?.clothingId ?? null : null
          }
          deletingId={removeItem.isPending ? removeItem.variables ?? null : null}
          onReturn={(clothingId, quantity) =>
            returnItem.mutateAsync({ clothingId, quantity })
          }
          onDelete={(clothingId) => removeItem.mutate(clothingId)}
        />
      ) : null}
    </div>
  );
}
