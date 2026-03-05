import { Button } from '@/components/ui/button';
import { File_Request } from '@/features/task-management/types/index.types';
import {
  fileIcon,
  getFileName,
} from '@/features/task-management/utils/fileHandling';
import { SuccessResponse } from '@/types/api.types';
import { UseMutateFunction } from '@tanstack/react-query';

type FilesContentProps = {
  fetchFiles: File_Request[] | undefined;
  deleteFiles: UseMutateFunction<
    Pick<SuccessResponse, 'success'>,
    Error,
    number,
    unknown
  >;
};

const FilesContent = ({ fetchFiles, deleteFiles }: FilesContentProps) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {fetchFiles?.map((file, index) => {
          return (
            <div
              key={index}
              className="flex flex-col rounded-xl p-3 transition-colors outline-1 outline-gray-200"
            >
              <div className="flex justify-end">
                <Button
                  size={'icon-sm'}
                  variant={'default'}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFiles(file.id);
                  }}
                  className="rounded-xl text-gray-500 hover:text-black cursor-pointer"
                >
                  X
                </Button>
              </div>
              <div className="flex justify-center">
                <img
                  className="outline outline-gray-200 w-15 h-15 object-cover rounded-xl"
                  src={file.cloud_url}
                  alt="not showing"
                />
              </div>

              <div className="text-center">
                <div className="text-2xl mb-2">
                  {fileIcon(file.content_type)}
                </div>
                <p
                  className="text-sm font-medium truncate cursor-pointer"
                  onClick={() => window.open(file.cloud_url, '_blank')}
                >
                  {getFileName(file.cloud_url, file.original_filename)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(file.uploaded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default FilesContent;
