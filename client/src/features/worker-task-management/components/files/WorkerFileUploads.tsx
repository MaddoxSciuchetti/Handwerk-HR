import ModalOverlay from '@/components/modal/ModalOverlay';
import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useMemo } from 'react';
import useDeleteWorkerFile from '../../hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import FileUploadForm from './file_upload/FileUploadForm';
import FilesContent from './FilesContent';

type WorkerFileUploadsProps = {
  workerId: string;
  isUploadModalOpen: boolean;
  setIsUploadModalOpen: (open: boolean) => void;
};

function WorkerFileUploads({
  workerId,
  isUploadModalOpen,
  setIsUploadModalOpen,
}: WorkerFileUploadsProps) {
  const { fetchFiles, isLoading, isError } = useGetWorkerFiles(workerId);
  const { deleteFiles } = useDeleteWorkerFile(workerId);

  const filteredFiles = useMemo(() => fetchFiles ?? [], [fetchFiles]);

  if (isLoading) return <LoadingAlert />;
  if (isError) return <ErrorAlert />;

  return (
    <>
      <FilesContent fetchFiles={filteredFiles} deleteFiles={deleteFiles} />
      {!filteredFiles.length && (
        <div className="flex min-h-100 items-center justify-center py-10 text-sm text-muted-foreground">
          Keine Hochgeladenen Dateien
        </div>
      )}

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
