import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';
import type { RefObject } from 'react';

type MaterialsDropzoneProps = {
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onFile: (file: File) => void;
  className?: string;
};

export function MaterialsDropzone({
  inputRef,
  disabled,
  onFile,
  className,
}: MaterialsDropzoneProps) {
  return (
    <div
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border p-8 text-center',
        className
      )}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file && !disabled) onFile(file);
      }}
    >
      <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-sm font-medium">Rechnung oder Foto hochladen</p>
      <p className="text-xs text-muted-foreground">PDF oder Bild, bis 10 MB</p>
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,application/pdf"
        data-testid="materials-file-input"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
