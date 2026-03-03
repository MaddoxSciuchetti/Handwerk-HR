import { useToggleModal } from '@/hooks/use-toggleModal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import JSZip from 'jszip';
import { useState } from 'react';
import { Button } from '../../../../../components/ui/button';
import FileUpload01 from '../../../../../components/ui/file_upload/form-main';
import { Spinner } from '../../../../../components/ui/spinner';
import {
  deleteWorkerFile,
  fetchCloudUrl,
  getWorkerFiles,
} from '../../../api/index.api';
import { File_Request } from '../../../types/index.types';
import { fileIcon, getFileName } from '../../../utils/fileHandling';

type WorkerFileUploadsProps = {
  id: number;
};

function WorkerFileUploads({ id }: WorkerFileUploadsProps) {
  const [setModal, setModalState] = useState<boolean>(false);

  const {
    data: fetchFiles,
    error,
    isLoading,
    isFetching,
  } = useQuery<File_Request[]>({
    queryKey: ['historyData', id],
    queryFn: () => getWorkerFiles(id),
  });

  const queryClient = useQueryClient();

  const { mutate: deleteFiles } = useMutation({
    mutationFn: (fileId: number) => deleteWorkerFile(fileId),
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey: ['historyData', id] });

      queryClient.setQueryData<File_Request[]>(
        ['historyData', id],
        (old) => old?.filter((file) => file.id !== fileId) || []
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['historyData', id] });
      console.log('this is the invalidation number');
    },
  });

  const { toggleModal } = useToggleModal();

  const openModal = () => {
    toggleModal();
    setModalState(true);
  };

  const closeModal = () => {
    toggleModal();
    setModalState((prev) => !prev);
  };

  const handleZipExport = async () => {
    const zip = new JSZip();

    const fetchPromises = fetchFiles?.map(async (value) => {
      const blob = await fetchCloudUrl(value.cloud_key);
      const fileName = value.original_filename.split('/').pop() ?? 'file';
      zip.file(fileName, blob);
    });

    await Promise.all(fetchPromises ?? []);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'archive.zip';
    link.click();
  };

  return (
    <>
      <div className="text-right ">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center min-h-100">
            {' '}
            <Spinner className="size-8" />
          </div>
        ) : !fetchFiles || fetchFiles.length === 0 ? (
          <>
            <div>
              <div className="flex flex-row justify-end pt-5 pr-5">
                <img
                  className=" flex flex-end cursor-pointer outline rounded-sm p-1"
                  onClick={openModal}
                  src="/assets/copy.svg"
                  alt="Upload File"
                />

                <Button
                  variant={'outline'}
                  onClick={() => handleZipExport()}
                  className="ml-4 cursor-pointer p-1"
                >
                  Zip export
                </Button>
              </div>
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
                onClick={openModal}
                src="/assets/copy.svg"
                alt="Upload File"
              />

              <Button
                variant={'outline'}
                onClick={() => handleZipExport()}
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

      {setModal && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black/50 cursor-pointer"
            aria-label="Close modal"
          />
          <FileUpload01 setModal={setModalState} id={id} />
        </div>
      )}
    </>
  );
}

export default WorkerFileUploads;
