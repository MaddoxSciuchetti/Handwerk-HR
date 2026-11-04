import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import type { PersonnelDocument } from '../../../api/personnelDocuments.api';
import { PersonnelDocumentRow } from './PersonnelDocumentRow';
import { PersonnelFolderCard } from './PersonnelFolderCard';
import {
  useFolderFileDrop,
  type StoredFileDrag,
} from '../../../hooks/useFolderFileDrop';
import { cn } from '@/lib/utils';

export type PersonnelFolderMoveTarget = {
  key: string;
  label: string;
  onOpen?: () => void;
  onMove: (file: StoredFileDrag) => void;
  onFiles: (files: File[]) => void;
};

type OpenPersonnelFolderProps = {
  label: string;
  onMove?: (file: StoredFileDrag) => void;
  documents: PersonnelDocument[];
  deletingId: string | null;
  onBack: () => void;
  onDelete: (documentId: string) => void;
  onFiles: (files: File[]) => void;
  moveTargets?: PersonnelFolderMoveTarget[];
};

export function OpenPersonnelFolder({
  label,
  documents,
  deletingId,
  onBack,
  onDelete,
  onFiles,
  onMove,
  moveTargets = [],
}: OpenPersonnelFolderProps) {
  const { isDragging, dropHandlers } = useFolderFileDrop(onFiles, onMove);
  return (
    <div
      className={cn(
        'min-h-60 px-10 py-4 transition-colors',
        isDragging && 'bg-muted/50'
      )}
      {...dropHandlers}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2 gap-1"
        onClick={onBack}
        aria-label={`Zurück zu allen Ordnern, ${label}`}
      >
        <ChevronLeft className="h-4 w-4" />
        {label}
      </Button>
      {moveTargets.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          {moveTargets.map((target) => (
            <PersonnelFolderCard
              key={target.key}
              label={target.label}
              onOpen={target.onOpen ?? onBack}
              onMove={(file) => {
                target.onMove(file);
                target.onOpen?.();
              }}
              onFiles={(files) => {
                target.onFiles(files);
                target.onOpen?.();
              }}
            />
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {documents.map((document) => (
          <PersonnelDocumentRow
            key={document.id}
            document={document}
            deleting={deletingId === document.id}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
