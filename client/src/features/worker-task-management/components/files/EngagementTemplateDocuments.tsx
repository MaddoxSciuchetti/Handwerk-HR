import { FileText } from 'lucide-react';
import { useState } from 'react';
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
