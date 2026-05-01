import ModalOverlay from '@/components/modal/ModalOverlay';
import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';

type PaymentMethodModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function PaymentMethodModal({ isOpen, onClose }: PaymentMethodModalProps) {
  if (!isOpen) return null;

  return (
    <ModalOverlay handleToggle={onClose}>
      <SmallWrapper className="h-auto min-h-0 max-h-none w-full max-w-md p-6">
        <div className="flex w-full flex-col gap-2 text-left">
          <p className="typo-body-md font-semibold text-foreground">
            Zahlungsmethode ändern
          </p>
          <p className="typo-body-sm text-muted-foreground">
            Hier kannst du in Zukunft deine Zahlungsmethode aktualisieren.
          </p>
        </div>
      </SmallWrapper>
    </ModalOverlay>
  );
}

export default PaymentMethodModal;
