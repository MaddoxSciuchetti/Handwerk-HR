import { useRef, useState, type DragEvent } from 'react';

export const STORED_FILE_DRAG_TYPE = 'application/x-handwerk-file';
export type StoredFileDrag = {
  id: string;
  source: 'personnel' | 'worker';
  engagementId?: string;
};

export function useFolderFileDrop(
  onFiles: (files: File[]) => void,
  onMove?: (file: StoredFileDrag) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);
  const isFileDrag = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).some(
      (type) =>
        type === 'Files' || (Boolean(onMove) && type === STORED_FILE_DRAG_TYPE)
    );

  return {
    isDragging,
    dropHandlers: {
      onDragEnter(event: DragEvent) {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        depth.current += 1;
        setIsDragging(true);
      },
      onDragOver(event: DragEvent) {
        if (!isFileDrag(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = Array.from(
          event.dataTransfer.types
        ).includes(STORED_FILE_DRAG_TYPE)
          ? 'move'
          : 'copy';
      },
      onDragLeave(event: DragEvent) {
        if (!isFileDrag(event)) return;
        depth.current = Math.max(0, depth.current - 1);
        if (!depth.current) setIsDragging(false);
      },
      onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        depth.current = 0;
        setIsDragging(false);
        const stored = event.dataTransfer.getData?.(STORED_FILE_DRAG_TYPE);
        if (stored && onMove) {
          try {
            const file = JSON.parse(stored) as StoredFileDrag;
            if (
              typeof file.id === 'string' &&
              (file.source === 'personnel' || file.source === 'worker')
            )
              onMove(file);
          } catch {
            /* Ignore unrelated or malformed drag data. */
          }
          return;
        }
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length) onFiles(files);
      },
    },
  };
}
