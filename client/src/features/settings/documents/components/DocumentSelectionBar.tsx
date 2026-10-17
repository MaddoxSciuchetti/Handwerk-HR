import EditModeBar from '@/features/all-tasks/components/EditModeBar';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import type { DocumentMasterListItem } from '../documentMaster.types';
import { useDeleteDocumentMaster } from '../useDeleteDocumentMaster';
import { useSetPrimaryDocumentMaster } from '../useSetPrimaryDocumentMaster';

type DocumentSelectionBarProps = {
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
  selected,
  onChange,
}: DocumentSelectionBarProps) {
  const remove = useDeleteDocumentMaster();
  const setPrimary = useSetPrimaryDocumentMaster();
  const [deleting, setDeleting] = useState(false);
  const single = selected.length === 1 ? selected[0] : null;
  const contractsOnly = selected.every(
    (master) => master.kind === 'employment_contract'
  );
  const canSetPrimary = Boolean(
    single && single.kind === 'employment_contract' && !single.isPrimary
  );
  const pending = deleting || setPrimary.isPending;

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

  return (
    <EditModeBar
      selectedItems={selected}
      setSelectedItems={onChange}
      isPending={pending}
      onDelete={() => void onDelete()}
      onClose={() => onChange([])}
      deleteLabel="Ausgewählte Dokumente löschen"
      actions={
        contractsOnly ? (
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={!canSetPrimary || pending}
            onClick={onSetPrimary}
          >
            Als Hauptvertrag
          </Button>
        ) : null
      }
    />
  );
}
