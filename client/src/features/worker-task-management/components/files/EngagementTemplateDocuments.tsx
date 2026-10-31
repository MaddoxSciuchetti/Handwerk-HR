import { printTemplateDocument } from '../../api/templateDocument.api';
import { printPdfBlob } from '../../printPdf';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { documentKindLabel } from '@/features/settings/documents/documentMaster.types';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { FilePlus, FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateTemplateDocument,
  useTemplateDocuments,
} from '../../hooks/useTemplateDocuments';
import { StoredFileBox } from './StoredFileBox';
import { TemplateDocumentDialog } from './TemplateDocumentDialog';

type EngagementTemplateDocumentsProps = {
  workerId: string;
  engagementId: string;
  showCreate?: boolean;
};

export function EngagementTemplateDocuments({
  workerId,
  engagementId,
  showCreate = true,
}: EngagementTemplateDocumentsProps) {
  const documents = useTemplateDocuments(workerId, engagementId);
  const masters = useDocumentMasters();
  const create = useCreateTemplateDocument(workerId, engagementId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const printCache = useRef(new Map<string, Promise<Blob>>());
  const choices = masters.data ?? [];

  const prefetchPrint = (documentId: string) => {
    const cached = printCache.current.get(documentId);
    if (cached) return cached;
    const pending = printTemplateDocument(
      workerId,
      engagementId,
      documentId
    ).catch((error) => {
      printCache.current.delete(documentId);
      throw error;
    });
    printCache.current.set(documentId, pending);
    return pending;
  };

  const choose = (masterId: string) => {
    create.mutate(masterId, {
      onSuccess: (saved) => {
        setPickerOpen(false);
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
      {documents.isError ? (
        <p className="col-span-full text-sm text-destructive">
          Dokumente aus Vorlagen konnten nicht geladen werden.
        </p>
      ) : null}
      {(documents.data ?? []).map((document) => (
        <StoredFileBox
          key={document.id}
          label={document.name}
          icon={FileText}
          onOpen={() => setOpenId(document.id)}
          onPrefetchPrint={() => {
            void prefetchPrint(document.id);
          }}
          onPrint={async () => {
            await printPdfBlob(await prefetchPrint(document.id));
          }}
        />
      ))}
      {showCreate ? (
        <StoredFileBox
          label="Aus Vorlage"
          icon={FilePlus}
          onOpen={() => setPickerOpen(true)}
        />
      ) : null}
      {pickerOpen ? (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next && !create.isPending) setPickerOpen(false);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dokument aus Vorlage</DialogTitle>
              <DialogDescription>
                Wählen Sie eine Vorlage. Das Dokument wird für dieses Engagement
                angelegt und kann mit dem Fragebogen synchronisiert werden.
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
