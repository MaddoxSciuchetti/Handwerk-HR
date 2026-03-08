import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import React, { RefObject } from 'react';

interface FileDropzoneProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleBoxClick: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (files: FileList | null) => void;
}

export function FileDropzone({
  fileInputRef,
  handleBoxClick,
  handleDragOver,
  handleDrop,
  handleFileSelect,
}: FileDropzoneProps) {
  return (
    <div
      className="border-2 border-dashed border-border rounded-md p-4 flex flex-col items-center justify-center text-center cursor-pointer"
      onClick={handleBoxClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="mb-2 bg-muted rounded-full p-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        Lade deine Datei hoch
      </p>
      <Input
        type="file"
        id="fileUpload"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
    </div>
  );
}
