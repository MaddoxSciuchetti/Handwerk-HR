import { FilePrintButton } from '../FilePrintButton';
import {
  prefetchStoredFile,
  printStoredFile,
} from '../../../printStoredFile';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import { STORED_FILE_DRAG_TYPE } from '../../../hooks/useFolderFileDrop';
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
    <div
      draggable={!deleting}
      onDragStart={(event) => {
        event.dataTransfer.setData(
          STORED_FILE_DRAG_TYPE,
          JSON.stringify({
            id: document.id,
            source: 'personnel',
            engagementId: document.engagementId,
          })
        );
        event.dataTransfer.effectAllowed = 'move';
      }}
      className="group relative flex flex-col rounded-xl border border-border p-4 transition-colors hover:bg-(--dropdown-surface)"
      onPointerEnter={() => {
        void prefetchStoredFile(document.presignedUrl);
      }}
    >
      <div className="flex justify-end">
        <FilePrintButton
          label={document.originalFileName}
          onPrefetch={() => {
            void prefetchStoredFile(document.presignedUrl);
          }}
          onPrint={() =>
            printStoredFile(
              document.presignedUrl,
              document.originalFileName,
              document.mimeType
            )
          }
        />
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={deleting}
          aria-label={`${document.label} löschen`}
          onClick={() => onDelete(document.id)}
          className="cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="h-auto flex-col items-start gap-3 p-0 text-left font-normal hover:bg-transparent hover:text-foreground"
        aria-label={`${document.originalFileName} öffnen`}
        onClick={() => window.open(document.presignedUrl, '_blank')}
      >
        {isImage(document.mimeType) ? (
          <img
            src={document.presignedUrl}
            alt=""
            draggable={false}
            className="h-8 w-8 rounded-md object-cover"
          />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
        )}
        <span className="block w-full truncate text-sm font-medium">
          {document.originalFileName}
        </span>
      </Button>
    </div>
  );
}
