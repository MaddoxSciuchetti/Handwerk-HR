import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { documentKindLabel } from '@/features/settings/documents/documentMaster.types';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateTemplateDocuments,
  useSyncTemplateDocuments,
} from '../../hooks/useTemplateDocuments';

type CreateTemplateDocumentDialogProps = {
  workerId: string;
  engagementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionnaireCompleted: boolean;
};

export function CreateTemplateDocumentDialog({
  workerId,
  engagementId,
  open,
  onOpenChange,
  questionnaireCompleted,
}: CreateTemplateDocumentDialogProps) {
  const masters = useDocumentMasters();
  const createMany = useCreateTemplateDocuments(workerId, engagementId);
  const syncMany = useSyncTemplateDocuments(workerId, engagementId);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const choices = masters.data ?? [];
  const busy = createMany.isPending || syncMany.isPending;

  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
      setProgress(null);
    }
  }, [open]);

  const toggle = (masterId: string) => {
    setSelectedIds((current) =>
      current.includes(masterId)
        ? current.filter((id) => id !== masterId)
        : [...current, masterId]
    );
  };

  const toggleAll = () => {
    setSelectedIds((current) =>
      current.length === choices.length ? [] : choices.map((master) => master.id)
    );
  };

  const finishBatch = (created: number, synced: number, failed: number) => {
    if (created > 0 && failed === 0) {
      toast.success(
        synced > 0
          ? `${created} Dokument${created === 1 ? '' : 'e'} angelegt und synchronisiert`
          : `${created} Dokument${created === 1 ? '' : 'e'} angelegt`
      );
    } else if (created > 0) {
      toast.error(
        `${created} angelegt, ${failed} fehlgeschlagen${
          synced > 0 ? `, ${synced} synchronisiert` : ''
        }`
      );
    } else {
      toast.error('Die Dokumente konnten nicht angelegt werden');
    }
    setProgress(null);
    onOpenChange(false);
  };

  const runInsert = async (withSync: boolean) => {
    if (selectedIds.length === 0 || busy) return;
    setProgress(`0 von ${selectedIds.length}…`);
    const created = await createMany.mutateAsync(selectedIds);
    setProgress(`${created.ok.length} von ${selectedIds.length}…`);

    let synced = 0;
    let failed = created.failed;
    if (withSync && created.ok.length > 0) {
      setProgress(`Synchronisiere ${created.ok.length}…`);
      const syncedResult = await syncMany.mutateAsync(
        created.ok.map((document) => document.id)
      );
      synced = syncedResult.ok.length;
      failed += syncedResult.failed;
    }
    finishBatch(created.ok.length, synced, failed);
  };

  return open ? (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next && !busy) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument aus Vorlage</DialogTitle>
          <DialogDescription>
            Wählen Sie eine oder mehrere Vorlagen. Die Dokumente werden für
            dieses Engagement unter Dateien angelegt. Optional können die
            Eingabefelder direkt mit dem Fragebogen abgeglichen werden.
          </DialogDescription>
        </DialogHeader>
        {masters.isError ? (
          <p className="text-sm text-destructive">
            Vorlagen konnten nicht geladen werden.
          </p>
        ) : null}
        {masters.isPending ? (
          <p className="text-sm text-muted-foreground">
            Vorlagen werden geladen…
          </p>
        ) : null}
        {!masters.isPending && choices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Vorlagen vorhanden.
          </p>
        ) : null}
        {choices.length > 0 ? (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedIds.length > 0 && selectedIds.length === choices.length
              }
              disabled={busy}
              aria-label="Alle Vorlagen auswählen"
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} ausgewählt
            </span>
          </div>
        ) : null}
        <div className="flex max-h-80 flex-col gap-2 overflow-auto">
          {choices.map((master) => {
            const selected = selectedIds.includes(master.id);
            return (
              <label
                key={master.id}
                className="flex h-auto cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-3 text-left hover:bg-muted/40 has-disabled:cursor-not-allowed has-disabled:opacity-50"
              >
                <Checkbox
                  checked={selected}
                  disabled={busy}
                  aria-label={
                    selected
                      ? `${master.name} aus der Auswahl entfernen`
                      : `${master.name} auswählen`
                  }
                  onCheckedChange={() => toggle(master.id)}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {master.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {documentKindLabel(master.kind)}
                </span>
              </label>
            );
          })}
        </div>
        {progress ? (
          <p className="text-sm text-muted-foreground">{progress}</p>
        ) : null}
            {!questionnaireCompleted ? (
              <p className="text-sm text-muted-foreground">
                Kein ausgefüllter Fragebogen. Beim Synchronisieren werden die
                Stammdaten aus den Handwerker-Informationen verwendet.
              </p>
            ) : null}
            <DialogFooter className="gap-2 sm:justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={selectedIds.length === 0 || busy}
                onClick={() => void runInsert(false)}
              >
                Einfügen
              </Button>
              <Button
                type="button"
                disabled={selectedIds.length === 0 || busy}
                onClick={() => void runInsert(true)}
              >
                {questionnaireCompleted
                  ? 'Einfügen und synchronisieren'
                  : 'Einfügen und mit Stammdaten füllen'}
              </Button>
            </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;
}
