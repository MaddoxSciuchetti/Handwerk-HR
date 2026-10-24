import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
};

function DeleteConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
  title = 'Bist du sicher?',
  description = 'Dieser Eintrag wird dauerhaft gelöscht.',
}: DeleteConfirmModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="h-auto max-w-sm p-5 sm:max-w-sm">
        <div className="flex w-full flex-col gap-4 text-left">
          <DialogTitle className="text-sm font-semibold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {description}
          </DialogDescription>
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
