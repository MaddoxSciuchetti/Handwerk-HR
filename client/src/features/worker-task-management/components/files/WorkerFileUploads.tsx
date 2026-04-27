import ModalOverlay from '@/components/modal/ModalOverlay';
import { useToggleModal } from '@/hooks/useToggleModal';

import ErrorAlert from '@/components/alerts/ErrorAlert';
import LoadingAlert from '@/components/alerts/LoadingAlert';
import { useMemo } from 'react';
import useDeleteWorkerFile from '../../hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '../../hooks/useGetWorkerFiles';
import handleZipExport from '../../utils/handleZipExport';
import FileUploadForm from './file_upload/FileUploadForm';
import FileHeader from './FileHeader';
import FilesContent from './FilesContent';

type WorkerFileUploadsProps = {
  workerId: string;
};

function WorkerFileUploads({ workerId }: WorkerFileUploadsProps) {
  const { fetchFiles, isLoading, isError } = useGetWorkerFiles(workerId);
  const { deleteFiles } = useDeleteWorkerFile(workerId);
  const { toggleModal, modal, setModal } = useToggleModal();

  const filteredFiles = useMemo(() => {
    if (!fetchFiles) return [];

    return fetchFiles;
  }, [fetchFiles]);

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
