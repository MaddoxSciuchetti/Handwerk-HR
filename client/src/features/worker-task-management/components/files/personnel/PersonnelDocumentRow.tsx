import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import type { PersonnelDocument } from '../../../api/personnelDocuments.api';

type PersonnelDocumentRowProps = {
  document: PersonnelDocument;
  deleting: boolean;
  onDelete: (documentId: string) => void;
};

function isImage(mimeType: string | null) {
  return mimeType?.startsWith('image/') ?? false;
}

export function PersonnelDocumentRow({
  document,
  deleting,
  onDelete,
}: PersonnelDocumentRowProps) {
  return (
    <div className="flex flex-col rounded-xl border border-border p-4 transition-colors hover:bg-(--dropdown-surface)">
      <div className="flex justify-end">
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
      <button
        type="button"
        className="flex flex-col items-start gap-3 text-left"
        aria-label={`${document.originalFileName} öffnen`}
        onClick={() => window.open(document.presignedUrl, '_blank')}
      >
        {isImage(document.mimeType) ? (
          <img
            src={document.presignedUrl}
            alt=""
            className="h-8 w-8 rounded-md object-cover"
          />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
        )}
        <span className="block w-full truncate text-sm font-medium">
          {document.originalFileName}
        </span>
      </button>
    </div>
  );
}
