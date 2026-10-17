import { Button } from '@/components/ui/button';
import { ChevronLeft, Folder } from 'lucide-react';
import type { PersonnelDocument } from '../../../api/personnelDocuments.api';
import { PersonnelDocumentRow } from './PersonnelDocumentRow';

type OpenPersonnelFolderProps = {
  workerId: string;
  label: string;
  documents: PersonnelDocument[];
  deletingId: string | null;
  onBack: () => void;
  onDelete: (documentId: string) => void;
};

export function OpenPersonnelFolder({
  workerId,
  label,
  documents,
  deletingId,
  onBack,
  onDelete,
}: OpenPersonnelFolderProps) {
  return (
    <div className="px-10 py-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mb-3 -ml-2"
        onClick={onBack}
      >
        <ChevronLeft className="h-4 w-4" />
        Alle Ordner
      </Button>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Folder className="h-4 w-4 text-muted-foreground" aria-hidden />
        {label}
      </div>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Datei</p>
      ) : (
        documents.map((document) => (
          <PersonnelDocumentRow
            key={document.id}
            workerId={workerId}
            document={document}
            deleting={deletingId === document.id}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
