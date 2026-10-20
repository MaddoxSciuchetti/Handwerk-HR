import EditModeBar from '@/features/all-tasks/components/EditModeBar';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { DocumentMasterListItem } from '../documentMaster.types';
import { useDeleteDocumentMaster } from '../useDeleteDocumentMaster';
import { useDuplicateDocumentMaster } from '../useDuplicateDocumentMaster';
import { useSetPrimaryDocumentMaster } from '../useSetPrimaryDocumentMaster';

type DocumentSelectionBarProps = {
  masters: DocumentMasterListItem[];
  selected: DocumentMasterListItem[];
  onChange: (next: DocumentMasterListItem[]) => void;
};

function messageFrom(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return fallback;
}

export function DocumentSelectionBar({
  masters,
  selected,
  onChange,
}: DocumentSelectionBarProps) {
  const remove = useDeleteDocumentMaster();
  const duplicate = useDuplicateDocumentMaster();
  const setPrimary = useSetPrimaryDocumentMaster();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [copiedIds, setCopiedIds] = useState<string[]>([]);
  const single = selected.length === 1 ? selected[0] : null;
  const contractsOnly = selected.every(
    (master) => master.kind === 'employment_contract'
  );
  const canSetPrimary = Boolean(
    single && single.kind === 'employment_contract' && !single.isPrimary
  );
  const pending = deleting || duplicating || setPrimary.isPending;

  useEffect(() => {
    if (copiedIds.length === 0) return;
    const visible = copiedIds.every((id) =>
      masters.some((master) => master.id === id)
    );
    if (!visible) return;
    setCopiedIds([]);
    onChange([]);
  }, [copiedIds, masters, onChange]);

  const onDuplicate = async () => {
    if (pending || selected.length === 0) return;
    const remaining = [...selected];
    const created: string[] = [];
    setDuplicating(true);
    try {
      for (const master of selected) {
        const copy = await duplicate.mutateAsync(master.id);
        created.push(copy.id);
        remaining.shift();
      }
      setCopiedIds(created);
    } catch (error) {
      onChange(remaining);
      toast.error(
        messageFrom(error, 'Dokument konnte nicht dupliziert werden.')
      );
    } finally {
      setDuplicating(false);
    }
  };

  const onDelete = async () => {
    if (pending || selected.length === 0) return;
    setDeleting(true);
    const remaining = [...selected];
    try {
      for (const master of selected) {
        await remove.mutateAsync(master.id);
        remaining.shift();
      }
      onChange([]);
    } catch (error) {
      onChange(remaining);
      toast.error(messageFrom(error, 'Dokument konnte nicht gelöscht werden.'));
    } finally {
      setDeleting(false);
    }
  };

  const onSetPrimary = () => {
    if (!single || !canSetPrimary || pending) return;
    setPrimary.mutate(single.id, {
      onError: (error) =>
        toast.error(
          messageFrom(error, 'Die Versandvorlage konnte nicht gespeichert werden')
        ),
    });
  };

  if (selected.length === 0) return null;

  return (
    <EditModeBar
      selectedItems={selected}
      setSelectedItems={onChange}
      isPending={pending}
      onDelete={() => void onDelete()}
      onClose={() => onChange([])}
      deleteLabel="Ausgewählte Dokumente löschen"
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={pending}
            onClick={() => void onDuplicate()}
          >
            Duplizieren
          </Button>
          {contractsOnly ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              disabled={!canSetPrimary || pending}
              onClick={onSetPrimary}
            >
              Als Hauptvertrag
            </Button>
          ) : null}
        </>
      }
    />
  );
}
