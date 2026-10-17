import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';
import { useRef, type DragEvent } from 'react';

type PersonnelFileDropzoneProps = {
  file: File | null;
  onFile: (file: File) => void;
};

export function PersonnelFileDropzone({
  file,
  onFile,
}: PersonnelFileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const takeFile = (list: FileList | null) => {
    const next = list?.[0];
    if (next) onFile(next);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    takeFile(event.dataTransfer.files);
  };

  return (
    <div
      className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border p-4 text-center"
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="mb-2 rounded-full bg-muted p-3">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {file ? file.name : 'Datei hier ablegen'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        PNG, PDF oder ein anderes Format
      </p>
      <Input
        type="file"
        id="fileUpload"
        ref={inputRef}
        className="hidden"
        onChange={(event) => takeFile(event.target.files)}
      />
    </div>
  );
}
