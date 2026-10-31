import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { printTemplateDocument } from '../../api/templateDocument.api';
import {
  useSaveTemplateDocument,
  useSyncTemplateDocument,
  useTemplateDocument,
} from '../../hooks/useTemplateDocuments';
import { printPdfBlob } from '../../printPdf';
import { ContractDraftBody } from './ContractDraftBody';
import { UnmatchedQuestionnaireAnswers } from './UnmatchedQuestionnaireAnswers';
import {
  documentPreviewModalPanel,
  documentPreviewModalSize,
} from './documentPreviewModal';

type TemplateDocumentDialogProps = {
  workerId: string;
  engagementId: string;
  documentId: string;
  onClose: () => void;
};

export function TemplateDocumentDialog({
  workerId,
  engagementId,
  documentId,
  onClose,
}: TemplateDocumentDialogProps) {
  const { data, isLoading, isError } = useTemplateDocument(
    workerId,
    engagementId,
    documentId
  );
  const saveDraft = useSaveTemplateDocument(workerId, engagementId, documentId);
  const sync = useSyncTemplateDocument(workerId, engagementId, documentId);
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmSync, setConfirmSync] = useState(false);
  const [printing, setPrinting] = useState(false);
  const edited = useRef(false);

  useEffect(() => {
    if (!data || edited.current) return;
    setValues(data.values);
  }, [data]);

  const busy = saveDraft.isPending || sync.isPending || printing;

  const close = async () => {
    if (busy) return;
    if (data && JSON.stringify(values) !== JSON.stringify(data.values)) {
      try {
        await saveDraft.mutateAsync(values);
      } catch {
        toast.error('Entwurf konnte nicht gespeichert werden');
        return;
      }
    }
    onClose();
  };

  const print = async () => {
    if (!data || busy) return;
    setPrinting(true);
    try {
      await saveDraft.mutateAsync(values);
      const blob = await printTemplateDocument(
        workerId,
        engagementId,
        documentId,
        values
      );
      if (!(blob instanceof Blob)) {
        throw new Error('PDF konnte nicht geladen werden');
      }
      await printPdfBlob(blob);
    } catch (error) {
      toast.error(
        (error as { message?: string }).message ??
          'Das Dokument konnte nicht gedruckt werden'
      );
    } finally {
      setPrinting(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) void close();
      }}
    >
      <DialogContent
        className={cn(
          documentPreviewModalPanel,
          'h-[90dvh] sm:max-w-[min(96vw,90rem)]',
          documentPreviewModalSize
        )}
      >
        {isLoading ? <PdfSkeleton /> : null}
        {isError || (!isLoading && !data) ? (
          <p className="text-sm text-destructive">
            Das Dokument konnte nicht geladen werden.
          </p>
        ) : null}
        {data ? (
          <>
            <DialogHeader className="shrink-0 pr-8">
              <DialogTitle>{data.name}</DialogTitle>
              <DialogDescription>
                Prüfen Sie die Felder, gleichen Sie sie mit dem Fragebogen ab
                und drucken Sie das Dokument.
              </DialogDescription>
            </DialogHeader>
            <div className="flex shrink-0 flex-col gap-2">
              {data.questionnaireCompleted ? (
                confirmSync ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Abgleichen ersetzt alle Eingaben durch die Antworten des
                      Fragebogens, auch Werte, die von Hand geändert wurden.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setConfirmSync(false)}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          sync.mutate(undefined, {
                            onSuccess: (saved) => {
                              edited.current = false;
                              setValues(saved.values);
                              setConfirmSync(false);
                              toast.success(
                                'Dokument wurde mit dem Fragebogen abgeglichen'
                              );
                            },
                            onError: (error) =>
                              toast.error(
                                (error as { message?: string }).message ??
                                  'Abgleich ist fehlgeschlagen'
                              ),
                          })
                        }
                      >
                        {sync.isPending ? 'Wird abgeglichen…' : 'Werte ersetzen'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmSync(true)}
                  >
                    Abgleichen
                  </Button>
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  Der Fragebogen ist noch nicht ausgefüllt.
                </p>
              )}
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 gap-4 overflow-hidden">
              {(data.questionnaireAnswers ?? data.unmatchedAnswers).length >
              0 ? (
                <UnmatchedQuestionnaireAnswers
                  title="Fragebogen"
                  description="Alle Angaben aus dem Fragebogen. Ziehen Sie eine Angabe auf ein markiertes Feld im Dokument."
                  answers={
                    data.questionnaireAnswers ?? data.unmatchedAnswers
                  }
                />
              ) : null}
              <ContractDraftBody
                document={data.document}
                segments={data.segments}
                values={values}
                readOnly={false}
                acceptAnswerDrop={
                  (data.questionnaireAnswers ?? data.unmatchedAnswers)
                    .length > 0
                }
                onValueChange={(key, value) => {
                  edited.current = true;
                  setValues((current) => ({ ...current, [key]: value }));
                }}
              />
            </div>
            <div className="flex shrink-0 justify-end">
              <Button type="button" disabled={busy} onClick={() => void print()}>
                {printing ? 'Druckt…' : 'Drucken'}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
