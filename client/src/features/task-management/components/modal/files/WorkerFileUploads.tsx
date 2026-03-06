import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useDeleteWorkerFile from '@/features/task-management/hooks/useDeleteWorkerFile';
import useGetWorkerFiles from '@/features/task-management/hooks/useGetWorkerFiles';
import handleZipExport from '@/features/task-management/utils/handleZipExport';
import { useToggleModal } from '@/hooks/useToggleModal';
import { Spinner } from '../../../../../components/ui/spinner';
import FileUpload01 from './file_upload/form-main';
import FileHeader from './FileHeader';
import FilesContent from './FilesContent';

type WorkerFileUploadsProps = {
  id: number;
};

function WorkerFileUploads({ id }: WorkerFileUploadsProps) {
  const { fetchFiles } = useGetWorkerFiles(id);
  const { deleteFiles, options } = useDeleteWorkerFile(id);
  const { toggleModal, modal, setModal } = useToggleModal();

  if (options.isPending)
    return (
      <CenteredDiv>
        <Spinner />
      </CenteredDiv>
    );

  return (
    <>
      <div className="text-right ">
        <FileHeader
          toggleModal={toggleModal}
          handleZipExport={handleZipExport}
          fetchFiles={fetchFiles}
        />
        <FilesContent fetchFiles={fetchFiles} deleteFiles={deleteFiles} />
        {!fetchFiles || fetchFiles.length === 0 ? (
          <div className="flex items-center justify-center min-h-100">
            Keine Hochgeladenen Dateien
          </div>
        ) : (
          ''
        )}
      </div>

      {modal && (
        <ModalOverlay handleToggle={toggleModal}>
          <FileUpload01 setModal={setModal} id={id} />
        </ModalOverlay>
      )}
    </>
  );
}

export default WorkerFileUploads;
