import SmallWrapper from '@/components/modal/modalSizes/SmallWrapper';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import useFileSelect from '@/features/task-management/hooks/useFileSelect';
import useFileUpload from '@/features/task-management/hooks/useFileUpload';
import { FileDropzone } from './Dropzone';
import { FileList } from './FileList';

interface FileUploadFormProps {
  workerId: number;
  setModal: (val: boolean) => void;
}

export default function FileUploadForm({
  workerId,
  setModal,
}: FileUploadFormProps) {
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
      <SmallWrapper className="min-h-80 max-h-80">
        <div className="flex flex-col w-full min-w-0 items-center justify-center ">
          {error ? <div>Try again</div> : ''}
          <CardContent className="flex w-full min-w-0 flex-col">
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
              className={`${isLoading ? 'opacity-50' : ''} mt-5  cursor-pointer justify-center px-4 text-sm font-medium hover:text-foreground`}
            >
              {isLoading ? 'Hochladen...' : 'Hochladen'}
            </Button>
          </CardContent>
        </div>
      </SmallWrapper>
    </>
  );
}
