import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  documentKindLabel,
  isTemplateDocumentKind,
} from '@/features/settings/documents/documentMaster.types';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateTemplateDocument } from '../../hooks/useTemplateDocuments';
import { TemplateDocumentDialog } from './TemplateDocumentDialog';

type CreateTemplateDocumentDialogProps = {
  workerId: string;
  engagementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateTemplateDocumentDialog({
  workerId,
  engagementId,
  open,
  onOpenChange,
}: CreateTemplateDocumentDialogProps) {
  const masters = useDocumentMasters();
  const create = useCreateTemplateDocument(workerId, engagementId);
  const [openId, setOpenId] = useState<string | null>(null);
  const choices = (masters.data ?? []).filter((master) =>
    isTemplateDocumentKind(master.kind)
  );

  const choose = (masterId: string) => {
    create.mutate(masterId, {
      onSuccess: (saved) => {
        onOpenChange(false);
        setOpenId(saved.id);
      },
      onError: (error) =>
        toast.error(
          (error as { message?: string }).message ??
            'Das Dokument konnte nicht angelegt werden'
        ),
    });
  };

  return (
    <>
      {open ? (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next && !create.isPending) onOpenChange(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dokument aus Vorlage</DialogTitle>
              <DialogDescription>
                Wählen Sie eine Vorlage. Das Dokument wird für dieses Engagement
                angelegt und kann mit dem Fragebogen abgeglichen werden.
              </DialogDescription>
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
            <div className="flex max-h-80 flex-col gap-2 overflow-auto">
              {choices.map((master) => (
                <Button
                  key={master.id}
                  type="button"
                  variant="outline"
                  className="h-auto justify-between gap-3 py-3"
                  disabled={create.isPending}
                  onClick={() => choose(master.id)}
                >
                  <span className="min-w-0 truncate">{master.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {documentKindLabel(master.kind)}
                  </span>
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
      {openId ? (
        <TemplateDocumentDialog
          workerId={workerId}
          engagementId={engagementId}
          documentId={openId}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </>
  );
}
