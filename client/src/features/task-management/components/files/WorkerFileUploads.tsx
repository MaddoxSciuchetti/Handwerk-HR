import ModalOverlay from '@/components/modal/ModalOverlay';
import useDeleteWorkerFile from '@/features/task-management/hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '@/features/task-management/hooks/useGetWorkerFiles';
import handleZipExport from '@/features/task-management/utils/handleZipExport';
import { useToggleModal } from '@/hooks/useToggleModal';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { getFileName } from '@/features/task-management/utils/fileHandling';
import { useMemo } from 'react';
import FileUploadForm from './file_upload/FileUploadForm';
import FileHeader from './FileHeader';
import FilesContent from './FilesContent';

type WorkerFileUploadsProps = {
  workerId: number;
  fileDescriptionSearch: string;
};

function WorkerFileUploads({
  workerId,
  fileDescriptionSearch,
}: WorkerFileUploadsProps) {
  const { fetchFiles, isLoading, isError } = useGetWorkerFiles(workerId);
  const { deleteFiles } = useDeleteWorkerFile(workerId);
  const { toggleModal, modal, setModal } = useToggleModal();

  const filteredFiles = useMemo(() => {
    if (!fetchFiles) return [];

    const query = fileDescriptionSearch.trim().toLowerCase();
    if (!query) return fetchFiles;

    return fetchFiles.filter((file) =>
      getFileName(file.cloud_url, file.original_filename)
        .toLowerCase()
        .includes(query)
    );
  }, [fetchFiles, fileDescriptionSearch]);

  if (isLoading) return <LoadingAlert />;
  if (isError) return <ErrorAlert />;

  return (
    <>
      <div className="text-right ">
        <FileHeader
          toggleModal={toggleModal}
          handleZipExport={handleZipExport}
          fetchFiles={fetchFiles}
        />
        <FilesContent fetchFiles={filteredFiles} deleteFiles={deleteFiles} />
        {!filteredFiles || filteredFiles.length === 0 ? (
          <div className="flex items-center justify-center min-h-100">
            Keine Hochgeladenen Dateien
          </div>
        ) : (
          ''
        )}
      </div>

      {modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <FileUploadForm setModal={setModal} workerId={workerId} />
        </ModalOverlay>
      )}
    </>
  );
}

export default WorkerFileUploads;
