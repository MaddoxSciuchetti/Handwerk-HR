import { Folder, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { StoredFileBox } from '../StoredFileBox';
import {
  useFolderFileDrop,
  type StoredFileDrag,
} from '../../../hooks/useFolderFileDrop';

type PersonnelFolderCardProps = {
  label: string;
  onOpen: () => void;
  onFiles: (files: File[]) => void;
  onMove?: (file: StoredFileDrag) => void;
  onDelete?: () => void;
  deleting?: boolean;
};

export function PersonnelFolderCard({
  label,
  onOpen,
  onFiles,
  onMove,
  onDelete,
  deleting,
}: PersonnelFolderCardProps) {
  const { isDragging, dropHandlers } = useFolderFileDrop(onFiles, onMove);
  return (
    <div
      className={cn('group relative min-w-0', isDragging && 'rounded-xl')}
      {...dropHandlers}
    >
      <StoredFileBox
        label={label}
        icon={Folder}
        onOpen={onOpen}
        // Also attach on the button so dragover/preventDefault hits the element
        // under the cursor; onDrop stopPropagation avoids double-handling.
        {...dropHandlers}
        className={cn(
          'w-full',
          isDragging && 'border-muted-foreground bg-muted/50'
        )}
      />
      {onDelete && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={deleting}
          draggable={false}
          aria-label={`${label} löschen`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute right-2 top-2 z-10 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
