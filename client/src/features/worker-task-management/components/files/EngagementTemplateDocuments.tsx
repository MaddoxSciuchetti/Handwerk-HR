import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { printTemplateDocument } from '../../api/templateDocument.api';
import { printPdfBlob } from '../../printPdf';
import {
  useSyncTemplateDocuments,
  useTemplateDocuments,
} from '../../hooks/useTemplateDocuments';
import { StoredFileBox } from './StoredFileBox';
import { TemplateDocumentDialog } from './TemplateDocumentDialog';

type EngagementTemplateDocumentsProps = {
  workerId: string;
  engagementId: string;
  questionnaireCompleted: boolean;
};

export function EngagementTemplateDocuments({
  workerId,
  engagementId,
  questionnaireCompleted,
}: EngagementTemplateDocumentsProps) {
  const documents = useTemplateDocuments(workerId, engagementId);
  const syncMany = useSyncTemplateDocuments(workerId, engagementId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const printCache = useRef(new Map<string, Promise<Blob>>());
  const items = documents.data ?? [];

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

  const toggleSelected = (documentId: string, selected: boolean) => {
    setSelectedIds((current) => {
      if (selected) {
        return current.includes(documentId)
          ? current
          : [...current, documentId];
      }
      return current.filter((id) => id !== documentId);
    });
  };

  const syncSelected = async () => {
    if (selectedIds.length === 0 || syncMany.isPending) return;
    const result = await syncMany.mutateAsync(selectedIds);
    if (result.ok.length > 0 && result.failed === 0) {
      toast.success(
        `${result.ok.length} Dokument${
          result.ok.length === 1 ? '' : 'e'
        } synchronisiert`
      );
      setSelectedIds([]);
      return;
    }
    if (result.ok.length > 0) {
      toast.error(
        `${result.ok.length} synchronisiert, ${result.failed} fehlgeschlagen`
      );
      setSelectedIds((current) =>
        current.filter((id) => !result.ok.some((doc) => doc.id === id))
      );
      return;
    }
    toast.error('Die Dokumente konnten nicht synchronisiert werden');
  };

  return (
    <>
      {documents.isError ? (
        <p className="col-span-full text-sm text-destructive">
          Dokumente aus Vorlagen konnten nicht geladen werden.
        </p>
      ) : null}
      {selectedIds.length > 0 ? (
        <div className="col-span-full flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} ausgewählt
          </span>
          <Button
            type="button"
            size="sm"
            disabled={syncMany.isPending}
            onClick={() => void syncSelected()}
          >
            {syncMany.isPending
              ? 'Wird synchronisiert…'
              : questionnaireCompleted
                ? 'Mit Fragebogen synchronisieren'
                : 'Mit Stammdaten synchronisieren'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={syncMany.isPending}
            onClick={() => setSelectedIds([])}
          >
            Auswahl aufheben
          </Button>
          {!questionnaireCompleted ? (
            <span className="text-sm text-muted-foreground">
              Kein Fragebogen — es werden die Handwerker-Informationen verwendet.
            </span>
          ) : null}
        </div>
      ) : null}
      {items.map((document) => (
        <StoredFileBox
          key={document.id}
          label={document.name}
          icon={FileText}
          selected={selectedIds.includes(document.id)}
          onSelectedChange={(selected) =>
            toggleSelected(document.id, selected)
          }
          onOpen={() => setOpenId(document.id)}
          onPrefetchPrint={() => {
            void prefetchPrint(document.id);
          }}
          onPrint={async () => {
            await printPdfBlob(await prefetchPrint(document.id));
          }}
        />
      ))}
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
