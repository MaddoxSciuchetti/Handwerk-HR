import { Button } from '@/components/ui/button';

import { SuccessResponse } from '@/types/api.types';
import { UseMutateFunction } from '@tanstack/react-query';
import { File_Request } from '../../types/index.types';
import { fileIcon, getFileName } from '../../utils/fileHandling';

type FilesContentProps = {
  fetchFiles: File_Request[] | undefined;
  deleteFiles: UseMutateFunction<
    Pick<SuccessResponse<unknown>, 'success'>,
    Error,
    string,
    unknown
  >;
};

const FilesContent = ({ fetchFiles, deleteFiles }: FilesContentProps) => {
  return (
    <>
      <div className="mt-0 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {fetchFiles?.map((file, index) => {
          return (
            <div
              key={index}
              className="flex flex-col rounded-xl border border-border hover:bg-(--dropdown-surface) p-3 transition-colors"
            >
              <div className="flex justify-end">
                <Button
                  size={'icon-sm'}
                  variant={'ghost'}
                  aria-label={`${getFileName(file.presignedUrl, file.name)} löschen`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFiles(file.id);
                  }}
                  className="cursor-pointer rounded-xl text-muted-foreground transition-colors hover:bg-(--hover-bg) hover:text-(--hover-foreground)"
                >
                  X
                </Button>
              </div>
              <div className="flex justify-center">
                <img
                  className="h-15 w-15 rounded-xl object-cover"
                  src={file.presignedUrl}
                  alt="not showing"
                />
              </div>

              <div className="text-center">
                <div className="text-2xl mb-2">
                  {fileIcon(file.mimeType ?? '')}
                </div>
                <p
                  className="text-sm font-medium truncate cursor-pointer"
                  onClick={() => window.open(file.presignedUrl, '_blank')}
                >
                  {getFileName(file.presignedUrl, file.name)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(file.createdAt).toLocaleDateString()}
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
