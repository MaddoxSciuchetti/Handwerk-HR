import { FilePrintButton } from '../FilePrintButton';
import { prefetchStoredFile, printStoredFile } from '../../../printStoredFile';
import { Button } from '@/components/ui/button';
import { FileText, X } from 'lucide-react';
import {
  endStoredFileDrag,
  writeStoredFileDrag,
} from '../../../hooks/useFolderFileDrop';
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
        writeStoredFileDrag(event.dataTransfer, {
          id: document.id,
          source: 'personnel',
          engagementId: document.engagementId,
        });
      }}
      onDragEnd={() => endStoredFileDrag()}
      className="group relative flex flex-col rounded-xl border border-border p-3 transition-colors hover:bg-(--dropdown-surface)"
      onPointerEnter={() => {
        void prefetchStoredFile(document.presignedUrl);
      }}
    >
      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
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
          draggable={false}
          aria-label={`${document.label} löschen`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(document.id);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      {/*
        Real link (not a button) so the parent `draggable` card can still start
        a drag from the icon/filename — nested buttons block HTML5 drag.
      */}
      <a
        href={document.presignedUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${document.originalFileName} öffnen`}
        className="flex cursor-pointer flex-col items-start gap-2 pr-14 text-left"
        onClick={(event) => event.stopPropagation()}
      >
        {isImage(document.mimeType) ? (
          <img
            src={document.presignedUrl}
            alt=""
            draggable={false}
            className="h-6 w-6 rounded-md object-cover"
          />
        ) : (
          <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
        )}
        <span className="block w-full truncate text-sm font-medium">
          {document.originalFileName}
        </span>
      </a>
    </div>
  );
}
