import ModalOverlay from '@/components/modal/ModalOverlay';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useMemo } from 'react';
import useDeleteWorkerFile from '../../hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import {
  EngagementCertificateList,
  type EngagementCertificateLink,
} from './EngagementCertificateList';
import {
  EngagementContractList,
  type EngagementContractLink,
} from './EngagementContractList';
import FileUploadForm from './file_upload/FileUploadForm';
import FilesContent from './FilesContent';

type WorkerFileUploadsProps = {
  workerId: string;
  contracts: EngagementContractLink[];
  certificates: EngagementCertificateLink[];
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
};

function WorkerFileUploads({
  workerId,
  contracts,
  certificates,
  isUploadModalOpen,
  setIsUploadModalOpen,
}: WorkerFileUploadsProps) {
  const { fetchFiles, isLoading, isError } = useGetWorkerFiles(workerId);
  const { deleteFiles } = useDeleteWorkerFile(workerId);

  const filteredFiles = useMemo(() => fetchFiles ?? [], [fetchFiles]);

  return (
    <>
      <EngagementContractList workerId={workerId} contracts={contracts} />
      <EngagementCertificateList certificates={certificates} />
      {isLoading ? <LoadingAlert /> : null}
      {isError ? <ErrorAlert /> : null}
      {!isLoading && !isError ? (
        <FilesContent fetchFiles={filteredFiles} deleteFiles={deleteFiles} />
      ) : null}
      {!isLoading &&
      !isError &&
      !filteredFiles.length &&
      !contracts.length &&
      !certificates.length ? (
        <div className="flex min-h-100 items-center justify-center py-10 text-sm text-muted-foreground">
          Keine Hochgeladenen Dateien
        </div>
      ) : null}

      {isUploadModalOpen && (
        <ModalOverlay handleToggle={() => setIsUploadModalOpen(false)}>
          <FileUploadForm
            setModal={setIsUploadModalOpen}
            workerId={workerId}
          />
        </ModalOverlay>
      )}
    </>
  );
}

export default WorkerFileUploads;
