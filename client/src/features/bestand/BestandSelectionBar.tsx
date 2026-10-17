import EditModeBar from '@/features/all-tasks/components/EditModeBar';
import { toast } from 'sonner';
import type { ClothingStockItem } from './bestand.api';
import { stockErrorMessage } from './stockError';
import { useDeleteClothingStockItem } from './useBestand';

type BestandSelectionBarProps = {
  selected: ClothingStockItem[];
  onChange: (items: ClothingStockItem[]) => void;
  deleting: boolean;
  setDeleting: (deleting: boolean) => void;
};

export function BestandSelectionBar({
  selected,
  onChange,
  deleting,
  setDeleting,
}: BestandSelectionBarProps) {
  const remove = useDeleteClothingStockItem();
  const onDelete = async () => {
    if (deleting || selected.length === 0) return;
    setDeleting(true);
    const remaining = [...selected];
    try {
      for (const item of selected) {
        await remove.mutateAsync(item.id);
        remaining.shift();
      }
      onChange([]);
    } catch (error) {
      onChange(remaining);
      toast.error(
        stockErrorMessage(error, 'Bestand konnte nicht gelöscht werden.')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <EditModeBar
      selectedItems={selected}
      setSelectedItems={onChange}
      isPending={deleting}
      onDelete={() => void onDelete()}
      onClose={() => onChange([])}
      deleteLabel="Ausgewählten Bestand löschen"
    />
  );
}
