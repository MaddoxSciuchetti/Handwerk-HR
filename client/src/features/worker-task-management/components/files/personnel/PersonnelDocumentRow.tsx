import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import type { PersonnelDocument } from '../../../api/personnelDocuments.api';
import { PersonnelFileName } from './PersonnelFileName';

type PersonnelDocumentRowProps = {
  workerId: string;
  document: PersonnelDocument;
  deleting: boolean;
  onDelete: (documentId: string) => void;
};

function isImage(mimeType: string | null) {
  return mimeType?.startsWith('image/') ?? false;
}

export function PersonnelDocumentRow({
  workerId,
  document,
  deleting,
  onDelete,
}: PersonnelDocumentRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 pl-6 pr-2">
      <button
        type="button"
        className="flex shrink-0 items-center"
        aria-label={`${document.originalFileName} öffnen`}
        onClick={() => window.open(document.presignedUrl, '_blank')}
      >
        {isImage(document.mimeType) ? (
          <img
            src={document.presignedUrl}
            alt=""
            className="h-10 w-10 rounded-md object-cover"
          />
        ) : (
          <FileText className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {document.label}
        </span>
        <PersonnelFileName
          workerId={workerId}
          documentId={document.id}
          name={document.originalFileName}
        />
      </div>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={deleting}
        aria-label={`${document.label} löschen`}
        onClick={() => onDelete(document.id)}
        className="cursor-pointer text-muted-foreground"
      >
        X
      </Button>
    </div>
  );
}
