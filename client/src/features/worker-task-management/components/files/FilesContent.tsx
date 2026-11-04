import { FilePrintButton } from './FilePrintButton';
import { prefetchStoredFile, printStoredFile } from '../../printStoredFile';
import {
  endStoredFileDrag,
  writeStoredFileDrag,
} from '../../hooks/useFolderFileDrop';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

const topActionClassName =
  'cursor-pointer text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100';

const FilesContent = ({ fetchFiles, deleteFiles }: FilesContentProps) => {
  return (
    <>
      <div className="mt-0 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {fetchFiles?.map((file) => {
          const label = getFileName(file.presignedUrl, file.name);
          return (
            <div
              key={file.id}
              draggable
              onDragStart={(event) => {
                writeStoredFileDrag(event.dataTransfer, {
                  id: file.id,
                  source: 'worker',
                });
              }}
              onDragEnd={() => endStoredFileDrag()}
              className="group relative flex flex-col rounded-xl border border-border p-3 transition-colors hover:bg-(--dropdown-surface)"
              onPointerEnter={() => {
                void prefetchStoredFile(file.presignedUrl);
              }}
            >
              <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                <FilePrintButton
                  label={label}
                  onPrefetch={() => {
                    void prefetchStoredFile(file.presignedUrl);
                  }}
                  onPrint={() =>
                    printStoredFile(file.presignedUrl, label, file.mimeType)
                  }
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  draggable={false}
                  aria-label={`${label} löschen`}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteFiles(file.id);
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  className={topActionClassName}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center pr-14">
                <img
                  className="h-15 w-15 rounded-xl object-cover"
                  src={file.presignedUrl}
                  draggable={false}
                  alt=""
                />
              </div>

              <div className="pr-14 text-center">
                <div className="mb-2 text-2xl">
                  {fileIcon(file.mimeType ?? '')}
                </div>
                <p
                  className="cursor-pointer truncate text-sm font-medium"
                  onClick={() => window.open(file.presignedUrl, '_blank')}
                >
                  {label}
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
