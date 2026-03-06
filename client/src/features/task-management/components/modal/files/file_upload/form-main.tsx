import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import useFileSelect from '@/features/task-management/hooks/useFileSelect';
import useFileUpload from '@/features/task-management/hooks/useFileUpload';
import { FileDropzone } from './dropzone';
import { FileList } from './file-list';

interface FileUploadProps01 {
  id: number;
  setModal: (val: boolean) => void;
}

export default function FileUpload01({ id, setModal }: FileUploadProps01) {
  const {
    uploadedFiles,
    setUploadedFiles,
    fileProgresses,
    setFileProgresses,
    error,
    isLoading,
    handleFileSubmit,
  } = useFileUpload(id, setModal);

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
      <Card className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10">
          {isLoading ? <div>...</div> : ''}
          {error ? <div>Try again</div> : ''}
          <CardContent className="w-120">
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
              className="h-9 px-4 text-sm font-medium hover:text-black cursor-pointer mt-5"
            >
              Erstellen
            </Button>
          </CardContent>
        </div>
      </Card>
    </>
  );
}
