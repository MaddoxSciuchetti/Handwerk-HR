import { useState, type DragEvent } from 'react';

export const STORED_FILE_DRAG_TYPE = 'application/x-handwerk-file';
export const STORED_FILE_TEXT_PREFIX = 'handwerk-file:';

export type StoredFileDrag = {
  id: string;
  source: 'personnel' | 'worker' | 'template';
  engagementId?: string;
  label?: string;
};

let activeStoredFileDrag: StoredFileDrag | null = null;

export function beginStoredFileDrag(file: StoredFileDrag) {
  activeStoredFileDrag = file;
}

export function endStoredFileDrag() {
  activeStoredFileDrag = null;
}

export function writeStoredFileDrag(
  dataTransfer: DataTransfer,
  file: StoredFileDrag
) {
  const payload = JSON.stringify(file);
  beginStoredFileDrag(file);
  dataTransfer.setData(STORED_FILE_DRAG_TYPE, payload);
  // Safari often drops custom MIME types from dataTransfer; keep a text/plain
  // copy and an in-memory handle so dragover/drop still recognize the move.
  dataTransfer.setData('text/plain', `${STORED_FILE_TEXT_PREFIX}${payload}`);
  dataTransfer.effectAllowed = 'move';
}

function parseStoredFileDrag(raw: string): StoredFileDrag | null {
  try {
    const file = JSON.parse(raw) as StoredFileDrag;
    if (
      typeof file.id === 'string' &&
      (file.source === 'personnel' ||
        file.source === 'worker' ||
        file.source === 'template')
    ) {
      return file;
    }
  } catch {
    /* Ignore unrelated or malformed drag data. */
  }
  return null;
}

function readStoredFileDrag(dataTransfer: DataTransfer): StoredFileDrag | null {
  const custom = dataTransfer.getData?.(STORED_FILE_DRAG_TYPE);
  if (custom) {
    const parsed = parseStoredFileDrag(custom);
    if (parsed) return parsed;
  }
  const text = dataTransfer.getData?.('text/plain') ?? '';
  if (text.startsWith(STORED_FILE_TEXT_PREFIX)) {
    const parsed = parseStoredFileDrag(
      text.slice(STORED_FILE_TEXT_PREFIX.length)
    );
    if (parsed) return parsed;
  }
  return activeStoredFileDrag;
}

function isFileDrag(event: DragEvent, allowStoredMove: boolean) {
  const types = Array.from(event.dataTransfer.types);
  if (types.includes('Files')) return true;
  if (!allowStoredMove) return false;
  return types.includes(STORED_FILE_DRAG_TYPE) || activeStoredFileDrag != null;
}

function isStoredFileDrag(event: DragEvent) {
  const types = Array.from(event.dataTransfer.types);
  return types.includes(STORED_FILE_DRAG_TYPE) || activeStoredFileDrag != null;
}

export function useFolderFileDrop(
  onFiles: (files: File[]) => void,
  onMove?: (file: StoredFileDrag) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const allowStoredMove = Boolean(onMove);

  return {
    isDragging,
    dropHandlers: {
      onDragEnter(event: DragEvent) {
        if (!isFileDrag(event, allowStoredMove)) return;
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
      },
      onDragOver(event: DragEvent) {
        if (!isFileDrag(event, allowStoredMove)) return;
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = isStoredFileDrag(event)
          ? 'move'
          : 'copy';
      },
      onDragLeave(event: DragEvent) {
        if (!isFileDrag(event, allowStoredMove)) return;
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setIsDragging(false);
      },
      onDrop(event: DragEvent) {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const stored = allowStoredMove
          ? readStoredFileDrag(event.dataTransfer)
          : null;
        if (stored && onMove) {
          endStoredFileDrag();
          onMove(stored);
          return;
        }
        const files = Array.from(event.dataTransfer.files ?? []);
        if (files.length) onFiles(files);
      },
    },
  };
}
