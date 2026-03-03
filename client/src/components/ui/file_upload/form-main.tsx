import { createWorkerFile } from '@/apis/index.apis';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HelpCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { FileDropzone } from './dropzone';
import { FileList } from './file-list';

interface FileUploadProps01 {
  id: number;
  setModal: (val: boolean) => void;
}

export default function FileUpload01({ id, setModal }: FileUploadProps01) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  );

  const queryClient = useQueryClient();

  const {
    mutate: uploadfiles,
    data: FileResponse,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (files: File[]) => createWorkerFile(files, id),
    onSuccess: () => {
      console.log('Upload successful, invalidting');
      queryClient.invalidateQueries({
        queryKey: ['historyData', id],
      });

      setModal(false);
      setUploadedFiles([]);
      setFileProgresses({});
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const handleFileSubmit = async () => {
    if (uploadedFiles.length > 0) {
      uploadfiles(uploadedFiles);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        setFileProgresses((prev) => ({
          ...prev,
          [file.name]: Math.min(progress, 100),
        }));
      }, 300);
    });
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (filename: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== filename));
    setFileProgresses((prev) => {
      const newProgresses = { ...prev };
      delete newProgresses[filename];
      return newProgresses;
    });
  };

  return (
    <>
      <Card className="max-h-min mt-40 mx-auto text-center items-center z-50 bg-gray-200 rounded-xl  w-2xl">
        <div className="flex items-center gap-10 justify-center mb-6 m-10">
          {isLoading ? <div>...</div> : ''}
          {error ? <div>Try again</div> : ''}
          <CardContent className="">
            <div className="p-6 pb-4"></div>
            {/* <Form /> */}
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
            <div className="px-6 py-3 border-t border-border bg-muted rounded-b-lg flex justify-between items-center">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center text-muted-foreground hover:text-foreground"
                    >
                      <HelpCircle className="h-4 w-4 mr-1" />
                      Hilfe?
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="py-3 bg-gray-200 text-foreground border">
                    <div className="space-y-1">
                      <p className="text-muted-foreground dark:text-muted-background text-xs max-w-50">
                        Ziehe deine Dateien in das Feld rein oder lade sie
                        direkt hoch.
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="flex gap-2">
                <Button
                  variant={'outline'}
                  onClick={handleFileSubmit}
                  className="h-9 px-4 text-sm font-medium hover:text-black"
                >
                  Erstellen
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </>
  );
}
