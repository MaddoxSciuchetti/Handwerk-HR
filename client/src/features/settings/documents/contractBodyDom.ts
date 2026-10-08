import type { DocumentSegment } from './documentSegments';

export const CONTRACT_INPUT_DRAG_TYPE = 'application/x-contract-input';

type DraggedContractInput = {
  key: string;
  label: string;
  source: HTMLElement | null;
};

let draggedContractInput: DraggedContractInput | null = null;

export function setDraggedContractInput(value: DraggedContractInput | null) {
  draggedContractInput = value;
}

export function getDraggedContractInput() {
  return draggedContractInput;
}

export function createInputChip(key: string, label: string): HTMLSpanElement {
  const chip = document.createElement('span');
  chip.contentEditable = 'false';
  chip.draggable = true;
  chip.dataset.inputKey = key;
  chip.dataset.inputLabel = label;
  chip.className =
    'mx-0.5 inline-flex cursor-grab items-center gap-1 rounded-md border border-border bg-muted px-1.5 py-0.5 align-baseline text-xs active:cursor-grabbing';

  const text = document.createElement('span');
  text.textContent = label;

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.dataset.removeInput = 'true';
  remove.className = 'text-muted-foreground';
  remove.setAttribute('aria-label', `${label} entfernen`);
  remove.textContent = '×';

  chip.append(text, remove);
  return chip;
}

export function paintSegments(
  root: HTMLElement,
  segments: DocumentSegment[]
): void {
  const nodes = segments.map((segment) =>
    segment.type === 'text'
      ? document.createTextNode(segment.text)
      : createInputChip(segment.key, segment.label)
  );
  root.replaceChildren(...nodes);
}

export function readSegments(root: HTMLElement): DocumentSegment[] {
  const segments: DocumentSegment[] = [];

  const pushText = (value: string) => {
    const text = value.replaceAll('\u00a0', ' ');
    if (text.length === 0) return;
    const last = segments.at(-1);
    if (last?.type === 'text') {
      last.text += text;
      return;
    }
    segments.push({ type: 'text', text });
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      pushText(node.textContent ?? '');
      return;
    }
    if (!(node instanceof HTMLElement) || node.dataset.removeInput) return;
    if (node.dataset.inputKey) {
      segments.push({
        type: 'input',
        key: node.dataset.inputKey,
        label: node.dataset.inputLabel || node.dataset.inputKey,
      });
      return;
    }
    if (node.tagName === 'BR') {
      pushText('\n');
      return;
    }
    const isBlock = node.tagName === 'DIV' || node.tagName === 'P';
    if (isBlock && segments.length > 0) pushText('\n');
    for (const child of node.childNodes) walk(child);
  };

  for (const child of root.childNodes) walk(child);
  return segments;
}
