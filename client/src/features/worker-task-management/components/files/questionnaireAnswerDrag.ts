import { useId, useSyncExternalStore, type DragEvent } from 'react';

export const QUESTIONNAIRE_ANSWER_DRAG_TYPE =
  'application/x-questionnaire-answer';

type DraggedQuestionnaireAnswer = { value: string };
let draggedQuestionnaireAnswer: DraggedQuestionnaireAnswer | null = null;
let target: string | null = null;
let snapshot: {
  answer: DraggedQuestionnaireAnswer | null;
  target: string | null;
} = { answer: null, target: null };
const listeners = new Set<() => void>();
let cleanup: (() => void) | undefined;

function publish() {
  snapshot = { answer: draggedQuestionnaireAnswer, target };
  listeners.forEach((listener) => listener());
}

function dropTarget(event: globalThis.DragEvent) {
  return event.target instanceof Element
    ? (event.target
        .closest('[data-questionnaire-answer-drop]')
        ?.getAttribute('data-questionnaire-answer-drop') ?? null)
    : null;
}

export function setDraggedQuestionnaireAnswer(
  value: DraggedQuestionnaireAnswer | null
) {
  cleanup?.();
  cleanup = undefined;
  draggedQuestionnaireAnswer = value;
  target = null;
  if (value) {
    const over = (event: globalThis.DragEvent) => {
      const next = dropTarget(event);
      if (event.dataTransfer)
        event.dataTransfer.dropEffect = next ? 'copy' : 'none';
      if (!next) event.stopPropagation();
      if (target !== next) {
        target = next;
        publish();
      }
    };
    const drop = (event: globalThis.DragEvent) => {
      if (dropTarget(event)) return;
      // Block native text insertion and the document editor's fallback drop.
      event.preventDefault();
      event.stopPropagation();
      setDraggedQuestionnaireAnswer(null);
    };
    const end = () => setDraggedQuestionnaireAnswer(null);
    const leave = (event: globalThis.DragEvent) => {
      if (!event.relatedTarget && target) {
        target = null;
        publish();
      }
    };
    document.addEventListener('dragover', over, true);
    document.addEventListener('drop', drop, true);
    document.addEventListener('dragend', end, true);
    document.addEventListener('dragleave', leave, true);
    cleanup = () => {
      document.removeEventListener('dragover', over, true);
      document.removeEventListener('drop', drop, true);
      document.removeEventListener('dragend', end, true);
      document.removeEventListener('dragleave', leave, true);
    };
  }
  publish();
}

export function getDraggedQuestionnaireAnswer() {
  return draggedQuestionnaireAnswer;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;

export function useQuestionnaireAnswerDrop<T extends HTMLElement>(
  enabled: boolean,
  onDrop: (value: string) => void
) {
  const id = useId();
  const drag = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const active = enabled && Boolean(drag.answer);
  return {
    'data-questionnaire-answer-drop': enabled ? id : undefined,
    className: active
      ? drag.target === id
        ? 'rounded outline outline-2 outline-offset-2 outline-emerald-600 !bg-emerald-100 !text-emerald-950'
        : 'rounded outline outline-1 outline-offset-2 outline-blue-400 !bg-blue-50'
      : '',
    onDragOver: (event: DragEvent<T>) => {
      if (!enabled || !getDraggedQuestionnaireAnswer()) return;
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
    },
    onDrop: (event: DragEvent<T>) => {
      const answer = getDraggedQuestionnaireAnswer();
      if (!enabled || !answer) return;
      event.preventDefault();
      event.stopPropagation();
      onDrop(answer.value);
      setDraggedQuestionnaireAnswer(null);
    },
  };
}

export function setQuestionnaireAnswerDragImage(event: DragEvent<HTMLElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const preview = event.currentTarget.cloneNode(true) as HTMLElement;
  preview.setAttribute('aria-hidden', 'true');
  Object.assign(preview.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    boxSizing: 'border-box',
    pointerEvents: 'none',
  });
  document.body.append(preview);
  event.dataTransfer.setDragImage?.(
    preview,
    event.clientX - rect.left,
    event.clientY - rect.top
  );
  requestAnimationFrame(() => preview.remove());
}
