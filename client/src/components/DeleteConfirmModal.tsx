import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';

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
    <ModalOverlay handleToggle={onCancel}>
      <SmallWrapper className="h-auto min-h-0 max-h-none w-full max-w-sm p-5">
        <div className="flex w-full flex-col gap-4 text-left">
          <p className="text-sm font-semibold text-foreground">
            Bist du sicher?
          </p>
          <p className="text-xs text-muted-foreground">
            Dieser Eintrag wird dauerhaft gelöscht.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Abbrechen
            </Button>
            <Button
              type="button"
              variant="destructive"
              aria-label="Löschen bestätigen"
              className="bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive)]"
              onClick={onConfirm}
            >
              Ja, löschen
            </Button>
          </div>
        </div>
      </SmallWrapper>
    </ModalOverlay>
  );
}

export default DeleteConfirmModal;
