import { printTemplateDocument } from '../../api/templateDocument.api';
import { printPdfBlob } from '../../printPdf';
import { FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTemplateDocuments } from '../../hooks/useTemplateDocuments';
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
  const [openId, setOpenId] = useState<string | null>(null);
  const printCache = useRef(new Map<string, Promise<Blob>>());

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
