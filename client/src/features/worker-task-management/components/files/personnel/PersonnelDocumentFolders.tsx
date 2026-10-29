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
import {
  useUploadPersonnelDocument,
  useMovePersonnelDocument,
  useDeletePersonnelFolder,
} from '../../../hooks/usePersonnelDocuments';
import type { StoredFileDrag } from '../../../hooks/useFolderFileDrop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

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
  hiddenFolders?: string[];
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
  hiddenFolders = [],
  questionnaires,
  contracts,
  certificates,
  deletingId,
  onDelete,
}: PersonnelDocumentFoldersProps) {
  const [openFolder, setOpenFolder] = useState<OpenFolder | null>(null);
  const upload = useUploadPersonnelDocument(workerId);
  const move = useMovePersonnelDocument(workerId);
  const removeFolder = useDeletePersonnelFolder(workerId);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const deleteFolder = (id: string, label: string, containsFiles: boolean) => {
    if (containsFiles) setDeleteTarget({ id, label });
    else removeFolder.mutate({ folderId: id, confirmed: false });
  };
  const moveFile = (
    file: StoredFileDrag,
    name: string,
    engagementId: string,
    folderId?: string
  ) => {
    move.mutate({
      documentId: file.id,
      source: file.source,
      engagementId: folderId
        ? engagementId
        : (file.engagementId ?? engagementId),
      name,
      folderId,
    });
  };
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
        onMove={(file) =>
          moveFile(
            file,
            openCustom ? 'ordner' : openBuiltin!.value,
            uploadEngagementId,
            openCustom?.id
          )
        }
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
        {engagements.map((engagement) => (
          <EngagementTemplateDocuments
            key={engagement.id}
            workerId={workerId}
            engagementId={engagement.id}
          />
        ))}
        <EngagementCertificateList certificates={certificates} />
        {PERSONNEL_DOCUMENT_NAMES.filter(
          (item) =>
            item.value !== 'fragebogen' &&
            (!hiddenFolders.includes(item.value) ||
              documents.some(
                (document) => !document.folderId && document.name === item.value
              ))
        ).map((item) => (
          <PersonnelFolderCard
            key={item.value}
            label={item.label}
            deleting={removeFolder.isPending}
            onDelete={() =>
              deleteFolder(
                `builtin:${item.value}`,
                item.label,
                documents.some(
                  (document) =>
                    !document.folderId && document.name === item.value
                )
              )
            }
            onMove={(file) => moveFile(file, item.value, defaultEngagementId)}
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
            deleting={removeFolder.isPending}
            onDelete={() =>
              deleteFolder(
                folder.id,
                folder.label,
                documents.some((document) => document.folderId === folder.id)
              )
            }
            onMove={(file) =>
              moveFile(file, 'ordner', folder.engagementId, folder.id)
            }
            onOpen={() => setOpenFolder({ kind: 'custom', id: folder.id })}
            onFiles={(files) =>
              uploadFiles(files, 'ordner', folder.engagementId, folder.id)
            }
          />
        ))}
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !removeFolder.isPending) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ordner löschen?</DialogTitle>
            <DialogDescription>
              Der Ordner „{deleteTarget?.label}“ enthält Dateien. Möchten Sie
              den Ordner und alle enthaltenen Dateien wirklich löschen? Diese
              Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={removeFolder.isPending}
              onClick={() => setDeleteTarget(null)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              disabled={removeFolder.isPending}
              onClick={() => {
                if (deleteTarget)
                  removeFolder.mutate(
                    { folderId: deleteTarget.id, confirmed: true },
                    { onSuccess: () => setDeleteTarget(null) }
                  );
              }}
            >
              {removeFolder.isPending
                ? 'Wird gelöscht…'
                : 'Ordner und Dateien löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
