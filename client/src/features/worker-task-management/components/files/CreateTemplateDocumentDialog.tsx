import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) {
      setSelectedIds([]);
      setProgress(null);
      setPickerOpen(false);
    }
  }
  const choices = masters.data ?? [];
  const busy = createMany.isPending || syncMany.isPending;
  const selectedLabels = choices
    .filter((master) => selectedIds.includes(master.id))
    .map((master) => master.name);

  const toggle = (masterId: string) => {
    setSelectedIds((current) =>
      current.includes(masterId)
        ? current.filter((id) => id !== masterId)
        : [...current, masterId]
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
      <DialogContent className="gap-3 p-4 sm:max-w-sm">
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate">Vorlagen auswählen</DialogTitle>
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
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-auto min-h-10 w-full justify-between gap-2 overflow-hidden px-3 py-2 font-normal"
                aria-label="Vorlagen auswählen"
                title={
                  selectedLabels.length === 1 ? selectedLabels[0] : undefined
                }
              >
                <span className="min-w-0 flex-1 truncate text-left">
                  {selectedLabels.length === 0
                    ? 'Vorlagen auswählen'
                    : selectedLabels.length === 1
                      ? selectedLabels[0]
                      : `${selectedLabels.length} Vorlagen ausgewählt`}
                </span>
                <ChevronDown
                  className="size-4 shrink-0 opacity-60"
                  aria-hidden
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] overflow-hidden p-1"
            >
              <div className="max-h-64 overflow-auto">
                {choices.map((master) => {
                  const selected = selectedIds.includes(master.id);
                  return (
                    <label
                      key={master.id}
                      className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 py-2 hover:bg-muted/50"
                      title={master.name}
                      onPointerDown={(event) => event.preventDefault()}
                    >
                      <Checkbox
                        checked={selected}
                        disabled={busy}
                        className="shrink-0"
                        aria-label={
                          selected
                            ? `${master.name} aus der Auswahl entfernen`
                            : `${master.name} auswählen`
                        }
                        onCheckedChange={() => toggle(master.id)}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {master.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
        {progress ? (
          <p className="text-sm text-muted-foreground">{progress}</p>
        ) : null}
        <DialogFooter className="mx-0 mb-0 gap-2 rounded-none border-0 bg-transparent p-0 sm:justify-between">
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
