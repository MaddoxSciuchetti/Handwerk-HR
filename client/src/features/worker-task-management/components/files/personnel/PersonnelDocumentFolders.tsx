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
import {
  EngagementCertificateList,
  type EngagementCertificateLink,
} from '../EngagementCertificateList';
import {
  EngagementContractList,
  type EngagementContractLink,
} from '../EngagementContractList';
import { EngagementTemplateDocuments } from '../EngagementTemplateDocuments';
import {
  EngagementQuestionnaireList,
  type EngagementQuestionnaireLink,
} from '../EngagementQuestionnaireList';
import { OpenPersonnelFolder } from './OpenPersonnelFolder';
import { PersonnelFolderCard } from './PersonnelFolderCard';
import { PersonnelDocumentRow } from './PersonnelDocumentRow';
import { useUploadPersonnelDocument } from '../../../hooks/usePersonnelDocuments';

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
  const [openFolder, setOpenFolder] = useState<OpenFolder | null>(null);
  const upload = useUploadPersonnelDocument(workerId);
  const defaultEngagementId = engagements[0]?.id ?? '';
  const uploadFiles = (
    files: File[],
    name: string,
    engagementId: string,
    folderId?: string
  ) => {
    for (const file of files) {
      upload.mutate({ engagementId, name, folderId, file });
    }
  };
  const openBuiltin = PERSONNEL_DOCUMENT_NAMES.find(
    (item) => openFolder?.kind === 'builtin' && item.value === openFolder.name
  );
  const openCustom =
    openFolder?.kind === 'custom'
      ? folders.find((folder) => folder.id === openFolder.id)
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
    const openDocuments = documents.filter((document) =>
      openCustom
        ? document.folderId === openCustom.id
        : !document.folderId && document.name === openBuiltin?.value
    );
    const uploadEngagementId = openCustom?.engagementId ?? defaultEngagementId;
    return (
      <OpenPersonnelFolder
        label={label}
        documents={openDocuments}
        deletingId={deletingId}
        onBack={() => setOpenFolder(null)}
        onDelete={onDelete}
        onFiles={(files) =>
          uploadFiles(
            files,
            openCustom ? 'ordner' : openBuiltin!.value,
            uploadEngagementId,
            openCustom?.id
          )
        }
      />
    );
  }

  return (
    <div className="px-10 py-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <EngagementQuestionnaireList
          workerId={workerId}
          questionnaires={questionnaires}
        />
        {documents
          .filter(
            (document) => document.name === 'fragebogen' && !document.folderId
          )
          .map((document) => (
            <PersonnelDocumentRow
              key={document.id}
              document={document}
              deleting={deletingId === document.id}
              onDelete={onDelete}
            />
          ))}
        <EngagementContractList workerId={workerId} contracts={contracts} />
        {engagements.map((engagement, index) => (
          <EngagementTemplateDocuments
            key={engagement.id}
            workerId={workerId}
            engagementId={engagement.id}
            showCreate={index === 0}
          />
        ))}
        <EngagementCertificateList certificates={certificates} />
        {PERSONNEL_DOCUMENT_NAMES.filter(
          (item) => item.value !== 'fragebogen'
        ).map((item) => (
          <PersonnelFolderCard
            key={item.value}
            label={item.label}
            onOpen={() => setOpenFolder({ kind: 'builtin', name: item.value })}
            onFiles={(files) =>
              uploadFiles(files, item.value, defaultEngagementId)
            }
          />
        ))}
        {folders.map((folder) => (
          <PersonnelFolderCard
            key={folder.id}
            label={folder.label}
            onOpen={() => setOpenFolder({ kind: 'custom', id: folder.id })}
            onFiles={(files) =>
              uploadFiles(files, 'ordner', folder.engagementId, folder.id)
            }
          />
        ))}
      </div>
    </div>
  );
}
