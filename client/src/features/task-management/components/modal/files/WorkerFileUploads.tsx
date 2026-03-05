import CenteredDiv from '@/components/alerts/layout-wrapper/CenteredDiv';
import ModalOverlay from '@/components/modal/ModalOverlay';
import useDeleteWorkerFiles from '@/features/task-management/hooks/use-deleteWorkerFiles';
import useGetWorkerFiles from '@/features/task-management/hooks/use-getWorkerFiles';
import handleZipExport from '@/features/task-management/utils/handleZipExport';
import { useToggleModal } from '@/hooks/use-toggleModal';
import { Button } from '../../../../../components/ui/button';
import { Spinner } from '../../../../../components/ui/spinner';
import { fileIcon, getFileName } from '../../../utils/fileHandling';
import FileUpload01 from './file_upload/form-main';
import FileHeader from './FileHeader';

type WorkerFileUploadsProps = {
  id: number;
};

function WorkerFileUploads({ id }: WorkerFileUploadsProps) {
  const { fetchFiles, isFetching, isLoading } = useGetWorkerFiles(id);
  const { deleteFiles } = useDeleteWorkerFiles(id);
  const { toggleModal, modal, setModal } = useToggleModal();

  if (isLoading || isFetching)
    return (
      <CenteredDiv>
        <Spinner />
      </CenteredDiv>
    );

  return (
    <>
      <div className="text-right ">
        {!fetchFiles || fetchFiles.length === 0 ? (
          <>
            <div>
              <FileHeader
                toggleModal={toggleModal}
                handleZipExport={handleZipExport}
                fetchFiles={fetchFiles}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                {fetchFiles?.map((file, index) => (
                  <div
                    key={index}
                    className=" rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors outline"
                  >
                    <Button
                      size={'icon-sm'}
                      variant={'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFiles(file.id);
                      }}
                    >
                      X
                    </Button>
                    <div className="text-center">
                      <div className="text-2xl mb-2">
                        {fileIcon(file.content_type)}
                      </div>
                      <p
                        className="text-sm font-medium truncate"
                        onClick={() => window.open(file.cloud_url, '_blank')}
                      >
                        {getFileName(file.cloud_url, file.original_filename)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center min-h-100">
              Keine Hochgeladenen Dateien
            </div>
          </>
        ) : (
          <div>
            <div className="flex flex-row justify-end pt-5 pr-5">
              <img
                className=" flex flex-end cursor-pointer outline rounded-sm p-1"
                onClick={toggleModal}
                src="/assets/copy.svg"
                alt="Upload File"
              />

              <Button
                variant={'outline'}
                onClick={() => handleZipExport(fetchFiles)}
                className="ml-4 cursor-pointer  p-1"
              >
                Zip export
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {fetchFiles.map((file, index) => (
                <div
                  key={index}
                  className=" rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors outline"
                >
                  <Button
                    size={'icon-sm'}
                    variant={'outline'}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFiles(file.id);
                    }}
                  >
                    X
                  </Button>
                  <div className="text-center">
                    <div className="text-2xl mb-2">
                      {fileIcon(file.content_type)}
                    </div>
                    <p
                      className="text-sm font-medium truncate"
                      onClick={() => window.open(file.cloud_url, '_blank')}
                    >
                      {getFileName(file.cloud_url, file.original_filename)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(file.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
