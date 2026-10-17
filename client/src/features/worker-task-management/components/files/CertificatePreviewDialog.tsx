import { Dialog, DialogContent } from '@/components/ui/dialog';

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
    <Dialog open onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="w-full max-w-3xl border-0 bg-transparent p-0 shadow-none sm:max-w-3xl">
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-hidden rounded-2xl bg-card p-6 text-card-foreground">
        <div className="pr-8">
          <h2 className="text-base font-medium">{name}</h2>
          <p className="text-sm text-muted-foreground">Versendet</p>
        </div>
        <p className="min-h-40 flex-1 overflow-auto text-sm whitespace-pre-wrap">
          {text}
        </p>
      </div>
      </DialogContent>
    </Dialog>
  );
}
