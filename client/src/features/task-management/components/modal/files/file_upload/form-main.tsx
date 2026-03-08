import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import useFileSelect from '@/features/task-management/hooks/useFileSelect';
import useFileUpload from '@/features/task-management/hooks/useFileUpload';
import { FileDropzone } from './dropzone';
import { FileList } from './file-list';

interface FileUploadProps01 {
  workerId: number;
  setModal: (val: boolean) => void;
}

export default function FileUpload01({
  workerId,
  setModal,
}: FileUploadProps01) {
  const {
    uploadedFiles,
    setUploadedFiles,
    fileProgresses,
    setFileProgresses,
    error,
    isLoading,
    handleFileSubmit,
  } = useFileUpload(workerId, setModal);

  const {
    fileInputRef,
    handleBoxClick,
    handleDragOver,
    handleDrop,
    removeFile,
    handleFileSelect,
  } = useFileSelect(setUploadedFiles, setFileProgresses);

  return (
    <>
      <SmallWrapper>
        <div className="mb-6 flex w-full min-w-0 items-center justify-center">
          {isLoading ? <div>...</div> : ''}
          {error ? <div>Try again</div> : ''}
          <CardContent className="flex w-full min-w-0 flex-col p-0">
            <FileDropzone
              fileInputRef={fileInputRef}
              handleBoxClick={handleBoxClick}
              handleDragOver={handleDragOver}
              handleDrop={handleDrop}
              handleFileSelect={handleFileSelect}
            />
            <FileList
              uploadedFiles={uploadedFiles}
              fileProgresses={fileProgresses}
              removeFile={removeFile}
            />
            <Button
              variant={'outline'}
              onClick={handleFileSubmit}
              className="h-9 px-4 text-sm font-medium justify-center hover:text-black cursor-pointer mt-5"
            >
              Erstellen
            </Button>
          </CardContent>
        </div>
      </SmallWrapper>
    </>
  );
}
