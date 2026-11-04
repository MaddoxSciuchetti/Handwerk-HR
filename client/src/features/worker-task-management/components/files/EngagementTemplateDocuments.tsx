import { Button } from '@/components/ui/button';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { printTemplateDocument } from '../../api/templateDocument.api';
import { printPdfBlob } from '../../printPdf';
import {
  endStoredFileDrag,
  writeStoredFileDrag,
} from '../../hooks/useFolderFileDrop';
import {
  useSyncTemplateDocuments,
  useTemplateDocuments,
} from '../../hooks/useTemplateDocuments';
import { StoredFileBox } from './StoredFileBox';
import { TemplateDocumentDialog } from './TemplateDocumentDialog';

type EngagementTemplateDocumentsProps = {
  workerId: string;
  engagementId: string;
};

export function EngagementTemplateDocuments({
  workerId,
  engagementId,
}: EngagementTemplateDocumentsProps) {
  const documents = useTemplateDocuments(workerId, engagementId);
  const syncMany = useSyncTemplateDocuments(workerId, engagementId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingSyncIds, setPendingSyncIds] = useState<string[]>([]);
  const printCache = useRef(new Map<string, Promise<Blob>>());
  const items = documents.data ?? [];
  const syncPopoverOpen = pendingSyncIds.length > 0;
  const anchorId = pendingSyncIds[0] ?? null;

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

  const clearPendingSync = () => {
    if (syncMany.isPending) return;
    setPendingSyncIds([]);
  };

  const toggleSelected = (documentId: string, selected: boolean) => {
    if (!selected) {
      setPendingSyncIds((current) => current.filter((id) => id !== documentId));
      return;
    }
    setPendingSyncIds((current) =>
      current.includes(documentId) ? current : [...current, documentId]
    );
  };

  const syncPending = async () => {
    if (pendingSyncIds.length === 0 || syncMany.isPending) return;
    const result = await syncMany.mutateAsync(pendingSyncIds);
    if (result.ok.length > 0 && result.failed === 0) {
      toast.success(
        `${result.ok.length} Dokument${
          result.ok.length === 1 ? '' : 'e'
        } synchronisiert`
      );
      setPendingSyncIds([]);
      return;
    }
    if (result.ok.length > 0) {
      toast.error(
        `${result.ok.length} synchronisiert, ${result.failed} fehlgeschlagen`
      );
      setPendingSyncIds((current) =>
        current.filter((id) => !result.ok.some((doc) => doc.id === id))
      );
      return;
    }
    toast.error('Die Dokumente konnten nicht synchronisiert werden');
  };

  return (
    <Popover
      open={syncPopoverOpen}
      onOpenChange={(next) => {
        if (!next) clearPendingSync();
      }}
    >
      {documents.isError ? (
        <p className="col-span-full text-sm text-destructive">
          Dokumente aus Vorlagen konnten nicht geladen werden.
        </p>
      ) : null}
      {items.map((document) => (
        <StoredFileBox
          key={document.id}
          label={document.name}
          icon={FileText}
          draggable
          onDragStart={(event) => {
            writeStoredFileDrag(event.dataTransfer, {
              id: document.id,
              source: 'template',
              engagementId,
              label: document.name,
            });
          }}
          onDragEnd={() => endStoredFileDrag()}
          selected={pendingSyncIds.includes(document.id)}
          selectionAnchor={document.id === anchorId}
          onSelectedChange={(selected) => toggleSelected(document.id, selected)}
          onOpen={() => setOpenId(document.id)}
          onPrefetchPrint={() => {
            void prefetchPrint(document.id);
          }}
          onPrint={async () => {
            await printPdfBlob(await prefetchPrint(document.id));
          }}
        />
      ))}
      <PopoverContent
        side="top"
        align="start"
        sideOffset={6}
        collisionPadding={12}
        className="w-auto gap-0 p-1.5"
        onInteractOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-template-file-select]')
          ) {
            event.preventDefault();
          }
        }}
      >
        <Button
          type="button"
          size="sm"
          className="h-8"
          disabled={syncMany.isPending}
          onClick={() => void syncPending()}
        >
          {syncMany.isPending ? '…' : 'Sync'}
        </Button>
      </PopoverContent>
      {openId ? (
        <TemplateDocumentDialog
          workerId={workerId}
          engagementId={engagementId}
          documentId={openId}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </Popover>
  );
}
