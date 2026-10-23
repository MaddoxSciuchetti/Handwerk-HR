import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClothingStockItem } from '@/features/bestand/bestand.api';
import { stockErrorMessage } from '@/features/bestand/stockError';
import { useClothingStock } from '@/features/bestand/useBestand';
import { MaterialsEngagementPicker } from '@/features/worker-task-management/components/materials/MaterialsEngagementPicker';
import {
  useCreateEngagementClothing,
  useEngagementClothing,
} from '@/features/worker-task-management/hooks/useEngagementClothing';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import type { WorkerDetailResponse } from '../types/index.types';

type Props = {
  workerId: string;
  engagements: WorkerDetailResponse['data']['engagements'];
};

type Draft = {
  key: string;
  stockItemId: string;
  quantity: string;
};

const rowClass =
  'grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4 border-b border-border/50 py-2.5';

const fieldClass =
  'h-8 w-full min-w-0 border-transparent bg-muted/50 text-right text-sm shadow-none focus:border-border focus:bg-muted focus-visible:border-border focus-visible:ring-0 dark:bg-muted/50 dark:focus:bg-muted';

let draftSequence = 0;

function emptyDraft(): Draft {
  draftSequence += 1;
  return {
    key: `clothing-draft-${draftSequence}`,
    stockItemId: '',
    quantity: '1',
  };
}

function reservedByOtherRows(drafts: Draft[], key: string, stockItemId: string) {
  return drafts.reduce((sum, draft) => {
    if (draft.key === key || draft.stockItemId !== stockItemId) return sum;
    const amount = Number(draft.quantity);
    return Number.isSafeInteger(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
}

export default function WorkerClothingPanel({ workerId, engagements }: Props) {
  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? null);
  const selectedId =
    engagements.find((item) => item.id === engagementId)?.id ??
    engagements[0]?.id ??
    null;
  const clothing = useEngagementClothing(workerId, selectedId);
  const stock = useClothingStock(Boolean(selectedId));
  const create = useCreateEngagementClothing(workerId, selectedId);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const available = stock.data?.filter((item) => item.quantity > 0) ?? [];

  useEffect(() => {
    if (!stock.data) return;
    const claimed = new Map<string, number>();
    let changed = false;
    const next = drafts.map((draft) => {
      if (!draft.stockItemId) return draft;
      const item = stock.data?.find((entry) => entry.id === draft.stockItemId);
      if (!item || item.quantity < 1) {
        changed = true;
        return { ...draft, stockItemId: '' };
      }
      const taken = claimed.get(item.id) ?? 0;
      if (taken >= item.quantity) {
        changed = true;
        return { ...draft, stockItemId: '' };
      }
      const amount = Number(draft.quantity);
      const quantity =
        Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
      claimed.set(item.id, taken + quantity);
      return draft;
    });
    if (changed) setDrafts(next);
  }, [drafts, stock.data]);

  function resetDraft() {
    setDrafts([]);
    setError(null);
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    );
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.isPending || drafts.length === 0) return;
    const parsed = drafts.map((draft) => {
      const item = stock.data?.find((entry) => entry.id === draft.stockItemId);
      return { draft, item, amount: Number(draft.quantity) };
    });
    if (parsed.some((row) => !row.item)) {
      setError('Bitte einen Artikel aus dem Bestand auswählen.');
      return;
    }
    if (
      parsed.some((row) => !Number.isSafeInteger(row.amount) || row.amount < 1)
    ) {
      setError('Anzahl muss eine ganze Zahl ab 1 sein.');
      return;
    }
    const requested = new Map<string, number>();
    for (const row of parsed) {
      const id = row.item?.id;
      if (!id) continue;
      requested.set(id, (requested.get(id) ?? 0) + row.amount);
    }
    const overStock = [...requested.entries()].some(([id, total]) => {
      const item = stock.data?.find((entry) => entry.id === id);
      return !item || total > item.quantity;
    });
    if (overStock) {
      setError('Nicht genug Bestand.');
      return;
    }
    setError(null);
    const pending = [...parsed];
    try {
      for (const row of pending) {
        if (!row.item) continue;
        await create.mutateAsync({
          stockItemId: row.item.id,
          quantity: row.amount,
        });
        setDrafts((rows) => rows.filter((draft) => draft.key !== row.draft.key));
      }
      setDrafts([]);
    } catch (submitError) {
      setError(
        stockErrorMessage(
          submitError,
          'Kleidung konnte nicht gespeichert werden.'
        )
      );
    }
  }

  if (!selectedId)
    return (
      <p className="py-3.5 text-sm text-muted-foreground">
        Kein Engagement vorhanden.
      </p>
    );

  const rowsReady =
    drafts.length > 0 &&
    drafts.every((draft) => {
      const item = stock.data?.find((entry) => entry.id === draft.stockItemId);
      const amount = Number(draft.quantity);
      if (!item || item.quantity < 1) return false;
      if (!Number.isSafeInteger(amount) || amount < 1) return false;
      const reserved = reservedByOtherRows(drafts, draft.key, item.id);
      return amount + reserved <= item.quantity;
    });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      {engagements.length > 1 ? (
        <div className={rowClass}>
          <span className="text-sm text-muted-foreground">Engagement</span>
          <MaterialsEngagementPicker
            engagements={engagements}
            value={selectedId}
            onChange={(id) => {
              setEngagementId(id);
              resetDraft();
            }}
            className="min-w-0"
            triggerClassName={cn(
              fieldClass,
              'justify-between *:data-[slot=select-value]:ml-auto'
            )}
          />
        </div>
      ) : null}
      {clothing.isLoading ? (
        <p className="py-3.5 text-sm text-muted-foreground">
          Kleidung wird geladen …
        </p>
      ) : null}
      {clothing.isError ? (
        <p role="alert" className="py-3.5 text-sm text-destructive">
          Kleidung konnte nicht geladen werden.
        </p>
      ) : null}
      {clothing.data?.map((item) => (
        <div key={item.id} className={`${rowClass} items-start py-3.5`}>
          <span className="text-sm text-muted-foreground">
            {item.name}
            <span className="block">{item.size || 'ohne Größe'}</span>
          </span>
          <span className="min-w-0 text-right text-sm break-words text-foreground tabular-nums">
            {item.quantity - item.returnedQuantity} Stück
            {item.returnedQuantity > 0 ? (
              <span className="block text-muted-foreground">
                {item.returnedQuantity} zurückgegeben
              </span>
            ) : null}
          </span>
        </div>
      ))}
      {!clothing.isLoading && !clothing.isError && !clothing.data?.length ? (
        <p className="py-3.5 text-sm text-muted-foreground">
          Noch keine Kleidung ausgegeben.
        </p>
      ) : null}
      {stock.isError ? (
        <p role="alert" className="py-3.5 text-sm text-destructive">
          Bestand konnte nicht geladen werden.
        </p>
      ) : null}
      <div className={rowClass}>
        <span className="text-sm text-muted-foreground">Artikel</span>
        <div className="flex justify-end">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="rounded-2xl"
            aria-label="Zeile hinzufügen"
            disabled={create.isPending || stock.isLoading || stock.isError}
            onClick={() => setDrafts((rows) => [...rows, emptyDraft()])}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>
      {drafts.map((draft) => {
        const selected = stock.data?.find(
          (item) => item.id === draft.stockItemId
        );
        const reserved = selected
          ? reservedByOtherRows(drafts, draft.key, selected.id)
          : 0;
        const max = selected
          ? Math.max(selected.quantity - reserved, 0)
          : undefined;
        const choices = available.flatMap((item) => {
          const reserved = reservedByOtherRows(drafts, draft.key, item.id);
          const remaining = item.quantity - reserved;
          if (remaining < 1) return [];
          return [{ ...item, quantity: remaining }];
        });
        return (
          <ClothingDraftRows
            key={draft.key}
            draft={draft}
            available={choices}
            max={max}
            disabled={create.isPending || stock.isLoading || stock.isError}
            onArticle={(stockItemId) => updateDraft(draft.key, { stockItemId })}
            onQuantity={(quantity) => updateDraft(draft.key, { quantity })}
            onRemove={() =>
              setDrafts((rows) => rows.filter((row) => row.key !== draft.key))
            }
          />
        );
      })}
      {error ? (
        <p role="alert" className="py-2 text-right text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {drafts.length > 0 ? (
        <div className="flex justify-end py-3.5">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="rounded-2xl"
            disabled={
              create.isPending || stock.isLoading || stock.isError || !rowsReady
            }
          >
            Speichern
          </Button>
        </div>
      ) : null}
    </form>
  );
}

type ClothingDraftRowsProps = {
  draft: Draft;
  available: ClothingStockItem[];
  max: number | undefined;
  disabled: boolean;
  onArticle: (stockItemId: string) => void;
  onQuantity: (quantity: string) => void;
  onRemove: () => void;
};

function ClothingDraftRows({
  draft,
  available,
  max,
  disabled,
  onArticle,
  onQuantity,
  onRemove,
}: ClothingDraftRowsProps) {
  const quantityId = `worker-clothing-quantity-${draft.key}`;

  return (
    <div className={rowClass}>
      <span className="text-sm text-muted-foreground">Artikel</span>
      <div className="flex min-w-0 items-center gap-2">
        <Select
          value={draft.stockItemId}
          onValueChange={onArticle}
          disabled={disabled}
        >
          <SelectTrigger
            id={`worker-clothing-article-${draft.key}`}
            aria-label="Artikel aus Bestand"
            className={cn(
              fieldClass,
              'min-w-0 flex-1 justify-between *:data-[slot=select-value]:ml-auto'
            )}
          >
            <SelectValue placeholder="Artikel auswählen" />
          </SelectTrigger>
          <SelectContent>
            {available.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name} · {item.size || 'ohne Größe'} · {item.quantity}{' '}
                verfügbar
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={quantityId}
          aria-label="Anzahl"
          type="number"
          min={1}
          max={max}
          step={1}
          value={draft.quantity}
          onChange={(event) => onQuantity(event.target.value)}
          required
          disabled={disabled}
          className={cn(fieldClass, 'w-16 shrink-0 px-2')}
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="shrink-0 rounded-2xl text-muted-foreground"
          aria-label="Zeile entfernen"
          disabled={disabled}
          onClick={onRemove}
        >
          <X aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
