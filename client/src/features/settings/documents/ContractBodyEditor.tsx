import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import {
  CONTRACT_INPUT_DRAG_TYPE,
  createInputChip,
  getDraggedContractInput,
  paintSegments,
  readSegments,
  setDraggedContractInput,
} from './contractBodyDom';
import type { DocumentSegment } from './documentSegments';

type ContractBodyEditorProps = {
  segments: DocumentSegment[];
  onChange: (segments: DocumentSegment[]) => void;
};

function caretRangeFromPoint(x: number, y: number): Range | null {
  const doc = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const fromPoint = doc.caretRangeFromPoint?.(x, y);
  if (fromPoint) return fromPoint;
  const position = document.caretPositionFromPoint?.(x, y);
  if (!position) return null;
  const range = document.createRange();
  range.setStart(position.offsetNode, position.offset);
  range.collapse(true);
  return range;
}

function rangeInEditor(root: HTMLElement, range: Range): Range | null {
  if (!root.contains(range.startContainer)) return null;
  let node: Node | null = range.startContainer;
  while (node && node !== root) {
    if (node instanceof HTMLElement && node.dataset.inputKey) {
      const after = document.createRange();
      after.setStartAfter(node);
      after.collapse(true);
      return after;
    }
    node = node.parentNode;
  }
  return range;
}

export function ContractBodyEditor({
  segments,
  onChange,
}: ContractBodyEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const skipPaint = useRef(false);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (skipPaint.current) {
      skipPaint.current = false;
      return;
    }
    paintSegments(root, segments);
  }, [segments]);

  const publish = () => {
    const root = rootRef.current;
    if (!root) return;
    skipPaint.current = true;
    onChange(readSegments(root));
  };

  const rememberSelection = () => {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.rangeCount === 0) return;
    if (!root.contains(selection.anchorNode)) return;
    savedRange.current = selection.getRangeAt(0).cloneRange();
  };

  const insertChip = (
    key: string,
    label: string,
    range: Range,
    source: HTMLElement | null
  ) => {
    const root = rootRef.current;
    const placed = root ? rangeInEditor(root, range) : null;
    if (!root || !placed) return;
    const marker = document.createTextNode('');
    placed.collapse(true);
    placed.insertNode(marker);
    if (source && root.contains(source)) {
      if (source.contains(marker) || marker.previousSibling === source) {
        marker.remove();
        return;
      }
      source.remove();
    }
    const at = document.createRange();
    at.setStartBefore(marker);
    at.collapse(true);
    marker.remove();
    const chip = createInputChip(key, label);
    const spacer = document.createTextNode(' ');
    at.insertNode(spacer);
    at.insertNode(chip);
    at.setStartAfter(spacer);
    at.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(at);
    savedRange.current = at.cloneRange();
    publish();
  };

  const readDraggedInput = (transfer: DataTransfer) => {
    const active = getDraggedContractInput();
    if (active) return active;
    const raw = transfer.getData('text/plain');
    if (!raw.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(raw) as { key?: string; label?: string };
      if (!parsed.key || !parsed.label) return null;
      return { key: parsed.key, label: parsed.label };
    } catch {
      return null;
    }
  };

  return (
    <div
      ref={rootRef}
      id="master-text"
      role="textbox"
      aria-multiline="true"
      aria-label="Vertragstext"
      contentEditable
      suppressContentEditableWarning
      className={cn(
        'min-h-80 flex-1 overflow-auto rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm whitespace-pre-wrap outline-none',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        dropping && 'border-ring ring-3 ring-ring/50'
      )}
      onDragStart={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (target.closest('[data-remove-input]')) {
          event.preventDefault();
          return;
        }
        const chip = target.closest('[data-input-key]');
        if (!(chip instanceof HTMLElement) || !rootRef.current?.contains(chip)) {
          return;
        }
        const key = chip.dataset.inputKey;
        const label = chip.dataset.inputLabel;
        if (!key || !label) return;
        const payload = JSON.stringify({ key, label });
        setDraggedContractInput({ key, label, source: chip });
        event.dataTransfer.setData(CONTRACT_INPUT_DRAG_TYPE, payload);
        event.dataTransfer.setData('text/plain', payload);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        queueMicrotask(() => setDraggedContractInput(null));
      }}
      onDragOver={(event) => {
        const dragged = getDraggedContractInput();
        if (!dragged) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = dragged.source ? 'move' : 'copy';
        const root = rootRef.current;
        const hit = caretRangeFromPoint(event.clientX, event.clientY);
        const range = root && hit ? rangeInEditor(root, hit) : null;
        if (!range) return;
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        savedRange.current = range.cloneRange();
      }}
      onDragEnter={(event) => {
        if (!getDraggedContractInput()) return;
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && rootRef.current?.contains(next)) return;
        setDropping(false);
      }}
      onDrop={(event) => {
        const dragged = readDraggedInput(event.dataTransfer);
        setDropping(false);
        if (!dragged) return;
        event.preventDefault();
        const root = rootRef.current;
        const hit = caretRangeFromPoint(event.clientX, event.clientY);
        const range =
          (root && hit ? rangeInEditor(root, hit) : null) ??
          savedRange.current;
        if (!range || !root) return;
        insertChip(dragged.key, dragged.label, range, dragged.source);
        setDraggedContractInput(null);
      }}
      onInput={publish}
      onKeyUp={rememberSelection}
      onMouseUp={rememberSelection}
      onKeyDown={(event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        document.execCommand('insertText', false, '\n');
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }}
      onClick={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement) || !target.dataset.removeInput) {
          return;
        }
        event.preventDefault();
        target.parentElement?.remove();
        publish();
      }}
    />
  );
}
