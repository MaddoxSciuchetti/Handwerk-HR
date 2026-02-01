import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { useRef, useState } from "react";
import { FileDropzone } from "./dropzone";
import { FileList } from "./file-list";
import { Form } from "./form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postFile } from "@/lib/api";

interface FileUploadProps01 {
  id: number;
  setModal: (val: boolean) => void;
}

export default function FileUpload01({ id, setModal }: FileUploadProps01) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {},
  );

  const queryClient = useQueryClient();

  const {
    mutate: uploadfiles,
    data: FileResponse,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (files: File[]) => postFile(files, id),
  });

  const handleFileSubmit = () => {
    if (uploadedFiles.length > 0) {
      uploadfiles(uploadedFiles);
      queryClient.invalidateQueries({
        queryKey: ["historydata", id],
      });
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
    <div className="">
      <div
        onClick={() => setModal(false)}
        className="h-screen inset-0 fixed z-40 bg-black/60"
      ></div>

      <Card className="absolute text-center items-center z-50 bg-gray-200 rounded-xl top-[20%] left-[50%] h-1/5 w-2xl -translate-x-1/2 -translate-y-1/2">
        <CardContent className="p-0">
          <div className="p-6 pb-4"></div>
          <Form />
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
                <TooltipContent className="py-3 bg-background text-foreground border">
                  <div className="space-y-1">
                    <p className="text-muted-foreground dark:text-muted-background text-xs max-w-[200px]">
                      Upload project images by dragging and dropping files or
                      using the file browser. Supported formats: JPG, PNG, SVG.
                      Maximum file size: 4MB.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-9 px-4 text-sm font-medium"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleFileSubmit}
                className="h-9 px-4 text-sm font-medium"
              >
                Erstellen
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
