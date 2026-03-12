import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';

interface UploadedFileItemProps {
  file: File;
  progress: number;
  onRemove: (filename: string) => void;
}

export function UploadedFileItem({
  file,
  progress,
  onRemove,
}: UploadedFileItemProps) {
  const imageUrl = URL.createObjectURL(file);

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  return (
    <div
      className="flex w-full min-w-0 flex-col rounded-lg border border-border p-2"
      key={file.name}
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="w-18 h-14 bg-muted rounded-sm flex items-center justify-center self-start row-span-2 overflow-hidden">
          <img
            src={imageUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex justify-between items-center">
            <div className="flex min-w-0 items-center gap-2">
              <span className="max-w-full truncate text-sm text-foreground">
                {file.name}
              </span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {Math.round(file.size / 1024)} KB
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 bg-transparent! hover:text-destructive"
              onClick={() => onRemove(file.name)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden flex-1">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${progress || 0}%`,
                }}
              ></div>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {Math.round(progress || 0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
