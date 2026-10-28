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
  useDeleteEngagementClothing,
  useEngagementClothing,
} from '@/features/worker-task-management/hooks/useEngagementClothing';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
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

type IssuedRow = {
  clothingId: string;
  stockItemId: string;
  quantity: string;
  originalStockItemId: string;
  originalQuantity: number;
  name: string;
  size: string;
  dirty: boolean;
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

function amountOf(quantity: string) {
  const amount = Number(quantity);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

function isIssuedDirty(row: IssuedRow) {
  return (
    row.dirty &&
    (row.stockItemId !== row.originalStockItemId ||
      amountOf(row.quantity) !== row.originalQuantity)
  );
}

function reservedByOthers(
  issued: IssuedRow[],
  drafts: Draft[],
  stockItemId: string,
  except: { clothingId?: string; draftKey?: string }
) {
  const saved = issued.reduce((sum, row) => {
    if (row.clothingId === except.clothingId) return sum;
    const released =
      row.originalStockItemId === stockItemId ? row.originalQuantity : 0;
    const planned = row.stockItemId === stockItemId ? amountOf(row.quantity) : 0;
    return sum + planned - released;
  }, 0);
  const pending = drafts.reduce((sum, draft) => {
    if (draft.key === except.draftKey || draft.stockItemId !== stockItemId) {
      return sum;
    }
    return sum + amountOf(draft.quantity);
  }, 0);
  return saved + pending;
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
  const remove = useDeleteEngagementClothing(workerId, selectedId);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [issued, setIssued] = useState<IssuedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const catalog = stock.data ?? [];
  const pending = create.isPending || remove.isPending;

  useEffect(() => {
    if (!clothing.data) return;
    setIssued((current) => {
      const edits = new Map(current.map((row) => [row.clothingId, row]));
      return clothing.data.flatMap<IssuedRow>((item) => {
        const outstanding = item.quantity - item.returnedQuantity;
        if (outstanding < 1) return [];
        const previous = edits.get(item.id);
        const base = {
          clothingId: item.id,
          originalStockItemId: item.stockItemId ?? '',
          originalQuantity: outstanding,
          name: item.name,
          size: item.size,
        };
        const serverStockItemId = item.stockItemId ?? '';
        if (
          previous?.dirty &&
          (previous.stockItemId !== serverStockItemId ||
            amountOf(previous.quantity) !== outstanding)
        ) {
          return [
            {
              ...base,
              stockItemId: previous.stockItemId,
              quantity: previous.quantity,
              dirty: true,
            },
          ];
        }
        return [
          {
            ...base,
            stockItemId: serverStockItemId,
            quantity: String(outstanding),
            dirty: false,
          },
        ];
      });
    });
  }, [clothing.data]);

  useEffect(() => {
    if (!stock.data) return;
    const claimed = new Map<string, number>();
    let changed = false;
    const next = drafts.map((draft) => {
      if (!draft.stockItemId) return draft;
      const item = stock.data?.find((entry) => entry.id === draft.stockItemId);
      const reserved = reservedByOthers(issued, [], draft.stockItemId, {});
      const free =
        (item ? item.quantity - reserved : 0) -
        (claimed.get(draft.stockItemId) ?? 0);
      if (!item || free < 1) {
        changed = true;
        return { ...draft, stockItemId: '' };
      }
      claimed.set(
        draft.stockItemId,
        (claimed.get(draft.stockItemId) ?? 0) + amountOf(draft.quantity)
      );
      return draft;
    });
    if (changed) setDrafts(next);
  }, [drafts, issued, stock.data]);

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

  function updateIssued(clothingId: string, patch: Partial<IssuedRow>) {
    setIssued((rows) =>
      rows.map((row) =>
        row.clothingId === clothingId ? { ...row, ...patch, dirty: true } : row
      )
    );
    setError(null);
  }

  function freeFor(
    stockItemId: string,
    except: { clothingId?: string; draftKey?: string }
  ) {
    const item = catalog.find((entry) => entry.id === stockItemId);
    if (!item) return 0;
    const row = except.clothingId
      ? issued.find((entry) => entry.clothingId === except.clothingId)
      : undefined;
    const released =
      row?.originalStockItemId === stockItemId ? row.originalQuantity : 0;
    return item.quantity + released - reservedByOthers(issued, drafts, stockItemId, except);
  }

  function choicesFor(except: { clothingId?: string; draftKey?: string }) {
    return catalog.flatMap((item) => {
      const remaining = freeFor(item.id, except);
      if (remaining < 1) return [];
      return [{ ...item, quantity: remaining }];
    });
  }

  function rowFits(
    stockItemId: string,
    quantity: string,
    except: { clothingId?: string; draftKey?: string }
  ) {
    const amount = amountOf(quantity);
    if (!stockItemId || amount < 1) return false;
    return amount <= freeFor(stockItemId, except);
  }

  async function removeIssued(clothingId: string) {
    if (pending) return;
    setError(null);
    try {
      await remove.mutateAsync(clothingId);
    } catch (removeError) {
      setError(
        stockErrorMessage(
          removeError,
          'Kleidung konnte nicht entfernt werden.'
        )
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dirtyIssued = issued.filter(isIssuedDirty);
    if (pending || (drafts.length === 0 && dirtyIssued.length === 0)) return;
    const entries = [
      ...drafts.map((draft) => ({
        stockItemId: draft.stockItemId,
        quantity: draft.quantity,
        except: { draftKey: draft.key },
      })),
      ...dirtyIssued.map((row) => ({
        stockItemId: row.stockItemId,
        quantity: row.quantity,
        except: { clothingId: row.clothingId },
      })),
    ];
    if (entries.some((entry) => !entry.stockItemId)) {
      setError('Bitte einen Artikel aus dem Bestand auswählen.');
      return;
    }
    if (entries.some((entry) => amountOf(entry.quantity) < 1)) {
      setError('Anzahl muss eine ganze Zahl ab 1 sein.');
      return;
    }
    if (
      entries.some(
        (entry) => !rowFits(entry.stockItemId, entry.quantity, entry.except)
      )
    ) {
      setError('Nicht genug Bestand.');
      return;
    }
    setError(null);
    try {
      for (const row of dirtyIssued) {
        const quantity = amountOf(row.quantity);
        await remove.mutateAsync(row.clothingId);
        await create.mutateAsync(
          row.stockItemId
            ? { stockItemId: row.stockItemId, quantity }
            : { name: row.name, size: row.size, quantity }
        );
      }
      for (const draft of drafts) {
        await create.mutateAsync({
          stockItemId: draft.stockItemId,
          quantity: amountOf(draft.quantity),
        });
        setDrafts((rows) => rows.filter((row) => row.key !== draft.key));
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

  const dirtyIssued = issued.filter(isIssuedDirty);
  const rowsReady =
    (drafts.length > 0 || dirtyIssued.length > 0) &&
    drafts.every((draft) =>
      rowFits(draft.stockItemId, draft.quantity, { draftKey: draft.key })
    ) &&
    dirtyIssued.every((row) =>
      rowFits(row.stockItemId, row.quantity, { clothingId: row.clothingId })
    );

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
            disabled={pending || stock.isLoading || stock.isError}
            onClick={() => setDrafts((rows) => [...rows, emptyDraft()])}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>
      {issued.map((row) => (
        <ClothingDraftRows
          key={row.clothingId}
          draft={{
            key: row.clothingId,
            stockItemId: row.stockItemId,
            quantity: row.quantity,
          }}
          available={choicesFor({ clothingId: row.clothingId })}
          max={
            row.stockItemId
              ? Math.max(freeFor(row.stockItemId, { clothingId: row.clothingId }), 0)
              : undefined
          }
          disabled={pending || stock.isLoading || stock.isError}
          onArticle={(stockItemId) => updateIssued(row.clothingId, { stockItemId })}
          onQuantity={(quantity) => updateIssued(row.clothingId, { quantity })}
          onRemove={() => removeIssued(row.clothingId)}
        />
      ))}
      {drafts.map((draft) => (
        <ClothingDraftRows
          key={draft.key}
          draft={draft}
          available={choicesFor({ draftKey: draft.key })}
          max={
            draft.stockItemId
              ? Math.max(freeFor(draft.stockItemId, { draftKey: draft.key }), 0)
              : undefined
          }
          disabled={pending || stock.isLoading || stock.isError}
          onArticle={(stockItemId) => updateDraft(draft.key, { stockItemId })}
          onQuantity={(quantity) => updateDraft(draft.key, { quantity })}
          onRemove={() =>
            setDrafts((rows) => rows.filter((row) => row.key !== draft.key))
          }
        />
      ))}
      {error ? (
        <p role="alert" className="py-2 text-right text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {drafts.length > 0 || dirtyIssued.length > 0 ? (
        <div className="flex justify-end py-3.5">
          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="rounded-2xl"
            disabled={pending || stock.isLoading || stock.isError || !rowsReady}
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
  const [open, setOpen] = useState(false);
  const quantityId = `worker-clothing-quantity-${draft.key}`;

  return (
    <div className={rowClass}>
      <span className="text-sm text-muted-foreground">Artikel</span>
      <div className="flex min-w-0 items-center gap-2">
        <Select
          open={open}
          onOpenChange={(next) => {
            if (next && available.length === 0) {
              toast.info('Kein Bestand vorhanden.');
              return;
            }
            setOpen(next);
          }}
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
