import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useState } from 'react';
import type { PersonnelDocument } from '../../../api/personnelDocuments.api';
import {
  PERSONNEL_DOCUMENT_NAMES,
  type PersonnelDocumentName,
} from '../../../personnel-documents/personnelDocumentNames';
import { MaterialsEngagementPicker } from '../../materials/MaterialsEngagementPicker';
import { OpenPersonnelFolder } from './OpenPersonnelFolder';
import { PersonnelFolderCard } from './PersonnelFolderCard';

type PersonnelDocumentFoldersProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  documents: PersonnelDocument[];
  deletingId: string | null;
  onDelete: (documentId: string) => void;
};

export function PersonnelDocumentFolders({
  workerId,
  engagements,
  documents,
  deletingId,
  onDelete,
}: PersonnelDocumentFoldersProps) {
  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? '');
  const [openName, setOpenName] = useState<PersonnelDocumentName | null>(null);
  const selectedId =
    engagements.find((item) => item.id === engagementId)?.id ??
    engagements[0]?.id ??
    '';
  const selectedDocuments = documents.filter(
    (document) => document.engagementId === selectedId
  );
  const openFolder = PERSONNEL_DOCUMENT_NAMES.find(
    (item) => item.value === openName
  );

  if (engagements.length === 0) {
    return (
      <p className="px-10 py-4 text-sm text-muted-foreground">
        Kein Engagement vorhanden.
      </p>
    );
  }

  if (openFolder) {
    return (
      <OpenPersonnelFolder
        workerId={workerId}
        label={openFolder.label}
        documents={selectedDocuments.filter(
          (document) => document.name === openFolder.value
        )}
        deletingId={deletingId}
        onBack={() => setOpenName(null)}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="px-10 py-4">
      <p className="mb-3 text-sm font-medium">Personal</p>
      <MaterialsEngagementPicker
        engagements={engagements}
        value={selectedId}
        onChange={(nextId) => {
          setEngagementId(nextId);
          setOpenName(null);
        }}
      />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {PERSONNEL_DOCUMENT_NAMES.filter((item) => {
          if (item.value !== 'fragebogen') return true;
          return selectedDocuments.some((document) => document.name === 'fragebogen');
        }).map((item) => (
          <PersonnelFolderCard
            key={item.value}
            label={item.label}
            count={
              selectedDocuments.filter((document) => document.name === item.value)
                .length
            }
            onOpen={() => setOpenName(item.value)}
          />
        ))}
      </div>
    </div>
  );
}
