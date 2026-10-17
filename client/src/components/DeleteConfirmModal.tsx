import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(next) => { if (!next) onCancel(); }}>
      <DialogContent className="h-auto max-w-sm p-5 sm:max-w-sm">
        <div className="flex w-full flex-col gap-4 text-left">
          <p className="text-sm font-semibold text-foreground">
            Bist du sicher?
          </p>
          <p className="text-xs text-muted-foreground">
            Dieser Eintrag wird dauerhaft gelöscht.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onCancel}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              aria-label="Löschen bestätigen"
              className="rounded-full bg-(--destructive) text-(--destructive-foreground) hover:bg-(--destructive)"
              onClick={onConfirm}
            >
              Ja, löschen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmModal;
