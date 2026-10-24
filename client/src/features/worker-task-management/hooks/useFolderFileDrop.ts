import { useRef, useState, type DragEvent } from 'react';

export function useFolderFileDrop(onFiles: (files: File[]) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const depth = useRef(0);
  const isFileDrag = (event: DragEvent) =>
    Array.from(event.dataTransfer.types).includes('Files');

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
        event.dataTransfer.dropEffect = 'copy';
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
        const files = Array.from(event.dataTransfer.files);
        if (files.length) onFiles(files);
      },
    },
  };
}
