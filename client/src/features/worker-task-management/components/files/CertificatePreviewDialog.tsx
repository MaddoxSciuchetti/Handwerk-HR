import ModalOverlay from '@/components/modal/ModalOverlay';

type CertificatePreviewDialogProps = {
  name: string;
  text: string;
  onClose: () => void;
};

export function CertificatePreviewDialog({
  name,
  text,
  onClose,
}: CertificatePreviewDialogProps) {
  return (
    <ModalOverlay handleToggle={onClose} size="max-w-3xl">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        <div className="pr-8">
          <h2 className="text-base font-medium">{name}</h2>
          <p className="text-sm text-muted-foreground">Versendet</p>
        </div>
        <p className="min-h-40 flex-1 overflow-auto text-sm whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </ModalOverlay>
  );
}
