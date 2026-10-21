import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useState } from 'react';
import type {
  PersonnelDocument,
  PersonnelFolder,
} from '../../../api/personnelDocuments.api';
import {
  PERSONNEL_DOCUMENT_NAMES,
  type PersonnelDocumentName,
} from '../../../personnel-documents/personnelDocumentNames';
import { MaterialsEngagementPicker } from '../../materials/MaterialsEngagementPicker';
import { EngagementCertificateList, type EngagementCertificateLink } from '../EngagementCertificateList';
import { EngagementContractList, type EngagementContractLink } from '../EngagementContractList';
import { EngagementTemplateDocuments } from '../EngagementTemplateDocuments';
import { EngagementQuestionnaireList, type EngagementQuestionnaireLink } from '../EngagementQuestionnaireList';
import { AddPersonnelFolder } from './AddPersonnelFolder';
import { OpenPersonnelFolder } from './OpenPersonnelFolder';
import { PersonnelFolderCard } from './PersonnelFolderCard';

type OpenFolder =
  | { kind: 'builtin'; name: PersonnelDocumentName }
  | { kind: 'custom'; id: string };

type PersonnelDocumentFoldersProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  documents: PersonnelDocument[];
  folders: PersonnelFolder[];
  questionnaires: EngagementQuestionnaireLink[];
  contracts: EngagementContractLink[];
  certificates: EngagementCertificateLink[];
  deletingId: string | null;
  onDelete: (documentId: string) => void;
};

export function PersonnelDocumentFolders({
  workerId,
  engagements,
  documents,
  folders,
  questionnaires,
  contracts,
  certificates,
  deletingId,
  onDelete,
}: PersonnelDocumentFoldersProps) {
  const [engagementId, setEngagementId] = useState(engagements[0]?.id ?? '');
  const [openFolder, setOpenFolder] = useState<OpenFolder | null>(null);
  const selectedId =
    engagements.find((item) => item.id === engagementId)?.id ??
    engagements[0]?.id ??
    '';
  const selectedDocuments = documents.filter(
    (document) => document.engagementId === selectedId
  );
  const selectedFolders = folders.filter(
    (folder) => folder.engagementId === selectedId
  );
  const openBuiltin = PERSONNEL_DOCUMENT_NAMES.find(
    (item) => openFolder?.kind === 'builtin' && item.value === openFolder.name
  );
  const openCustom =
    openFolder?.kind === 'custom'
      ? selectedFolders.find((folder) => folder.id === openFolder.id)
      : undefined;

  if (engagements.length === 0) {
    return (
      <p className="px-10 py-4 text-sm text-muted-foreground">
        Kein Engagement vorhanden.
      </p>
    );
  }

  if (openBuiltin || openCustom) {
    const label = openBuiltin?.label ?? openCustom?.label ?? '';
    const openDocuments = selectedDocuments.filter((document) =>
      openCustom
        ? document.folderId === openCustom.id
        : !document.folderId && document.name === openBuiltin?.value
    );
    return (
      <OpenPersonnelFolder
        label={label}
        documents={openDocuments}
        deletingId={deletingId}
        onBack={() => setOpenFolder(null)}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div className="px-10 py-4">
      <div className="mb-4 flex items-start justify-between gap-4 [&>div]:mb-0">
        <MaterialsEngagementPicker
          engagements={engagements}
          value={selectedId}
          onChange={(nextId) => {
            setEngagementId(nextId);
            setOpenFolder(null);
          }}
        />
        <AddPersonnelFolder workerId={workerId} engagementId={selectedId} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <EngagementQuestionnaireList
          workerId={workerId}
          questionnaires={questionnaires.filter(
            (item) => item.engagementId === selectedId
          )}
        />
        <EngagementContractList
          workerId={workerId}
          contracts={contracts.filter((item) => item.engagementId === selectedId)}
        />
        <EngagementTemplateDocuments
          workerId={workerId}
          engagementId={selectedId}
        />
        <EngagementCertificateList
          certificates={certificates.filter(
            (item) => item.engagementId === selectedId
          )}
        />
        {PERSONNEL_DOCUMENT_NAMES.filter((item) => item.value !== 'fragebogen').map(
          (item) => (
            <PersonnelFolderCard
              key={item.value}
              label={item.label}
              onOpen={() => setOpenFolder({ kind: 'builtin', name: item.value })}
            />
          )
        )}
        {selectedFolders.map((folder) => (
          <PersonnelFolderCard
            key={folder.id}
            label={folder.label}
            onOpen={() => setOpenFolder({ kind: 'custom', id: folder.id })}
          />
        ))}
      </div>
    </div>
  );
}
