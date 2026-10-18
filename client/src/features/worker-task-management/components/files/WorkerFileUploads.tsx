import { Dialog, DialogContent } from '@/components/ui/dialog';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import { FileCardsSkeleton, PersonnelFoldersSkeleton } from './FileSkeletons';
import type { EngagementType } from '@/features/worker-lifecycle/types/index.types';
import { useMemo } from 'react';
import useDeleteWorkerFile from '../../hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import {
  useDeletePersonnelDocument,
  usePersonnelDocuments,
} from '../../hooks/usePersonnelDocuments';
import type { EngagementCertificateLink } from './EngagementCertificateList';
import type { EngagementContractLink } from './EngagementContractList';
import FilesContent from './FilesContent';
import type { EngagementQuestionnaireLink } from './EngagementQuestionnaireList';
import { PersonnelDocumentFolders } from './personnel/PersonnelDocumentFolders';
import { PersonnelDocumentUploadForm } from './personnel/PersonnelDocumentUploadForm';

type WorkerFileUploadsProps = {
  workerId: string;
  engagements: Array<{
    id: string;
    type: EngagementType;
    startDate: string | null;
  }>;
  contracts: EngagementContractLink[];
  certificates: EngagementCertificateLink[];
  questionnaires?: EngagementQuestionnaireLink[];
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
};

function WorkerFileUploads({
  workerId,
  engagements,
  contracts,
  certificates,
  questionnaires = [],
  isUploadModalOpen,
  setIsUploadModalOpen,
}: WorkerFileUploadsProps) {
  const { fetchFiles, isLoading, isError } = useGetWorkerFiles(workerId);
  const { deleteFiles } = useDeleteWorkerFile(workerId);
  const personnelDocuments = usePersonnelDocuments(workerId);
  const deletePersonnelDocument = useDeletePersonnelDocument(workerId);

  const filteredFiles = useMemo(() => fetchFiles ?? [], [fetchFiles]);
  const personnel = personnelDocuments.data?.documents ?? [];
  const folders = personnelDocuments.data?.folders ?? [];

  return (
    <>
      {personnelDocuments.isError ? <ErrorAlert /> : null}
      {personnelDocuments.isLoading ? (
        <PersonnelFoldersSkeleton />
      ) : (
        <PersonnelDocumentFolders
          workerId={workerId}
          engagements={engagements}
          documents={personnel}
          folders={folders}
          questionnaires={questionnaires}
          contracts={contracts}
          certificates={certificates}
          deletingId={
            deletePersonnelDocument.isPending
              ? (deletePersonnelDocument.variables ?? null)
              : null
          }
          onDelete={(documentId) => deletePersonnelDocument.mutate(documentId)}
        />
      )}
      {isLoading ? <FileCardsSkeleton /> : null}
      {isError ? <ErrorAlert /> : null}
      {!isLoading && !isError && filteredFiles.length ? (
        <FilesContent fetchFiles={filteredFiles} deleteFiles={deleteFiles} />
      ) : null}
      {!isLoading &&
      !isError &&
      !personnelDocuments.isLoading &&
      !filteredFiles.length &&
      !engagements.length &&
      !contracts.length &&
      !questionnaires.length &&
      !certificates.length ? (
        <div className="flex min-h-100 items-center justify-center py-10 text-sm text-muted-foreground">
          Keine Hochgeladenen Dateien
        </div>
      ) : null}

      {isUploadModalOpen && (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) setIsUploadModalOpen(false);
          }}
        >
          <DialogContent className="h-auto max-h-[85vh] overflow-y-auto">
            <PersonnelDocumentUploadForm
              setModal={setIsUploadModalOpen}
              workerId={workerId}
              engagements={engagements}
              folders={folders}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default WorkerFileUploads;
