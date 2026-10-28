import { cn } from '@/lib/utils';
import {
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type DragEvent,
  type Ref,
} from 'react';
import {
  containsLiteralPlaceholder,
  insertMailPlaceholder,
  paintMailBody,
  rangeFromPoint,
  readMailBody,
  removeMailPill,
} from './mailBody';
import { MAIL_PLACEHOLDER_DRAG } from './mailPlaceholders';

export type MailBodyEditorHandle = {
  insertPlaceholder: (token: string, range?: Range | null) => void;
};

type MailBodyEditorProps = {
  ref?: Ref<MailBodyEditorHandle>;
  id: string;
  labelledBy: string;
  value: string;
  tokens: readonly string[];
  onChange: (value: string) => void;
};

function pillFromEventTarget(target: EventTarget | null, root: HTMLElement) {
  if (!(target instanceof Element)) return null;
  const pill = target.closest('[data-mail-placeholder]');
  if (!(pill instanceof HTMLElement) || !root.contains(pill)) return null;
  return pill;
}

export function MailBodyEditor({
  ref,
  id,
  labelledBy,
  value,
  tokens,
  onChange,
}: MailBodyEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const movingPillRef = useRef<HTMLElement | null>(null);

  const publish = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const next = readMailBody(root);
    onChange(next);
    if (!containsLiteralPlaceholder(root, tokens)) return;
    paintMailBody(root, next, tokens);
    const caret = document.createRange();
    caret.selectNodeContents(root);
    caret.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(caret);
  }, [onChange, tokens]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (
      readMailBody(root) === value &&
      !containsLiteralPlaceholder(root, tokens)
    ) {
      return;
    }
    paintMailBody(root, value, tokens);
  }, [tokens, value]);

  useImperativeHandle(ref, () => ({
    insertPlaceholder(token, range) {
      const root = rootRef.current;
      if (!root || !tokens.includes(token)) return;
      const selection = window.getSelection();
      const caret =
        range ??
        (document.activeElement === root &&
        selection &&
        selection.rangeCount > 0 &&
        root.contains(selection.anchorNode)
          ? selection.getRangeAt(0)
          : null);
      insertMailPlaceholder(root, token, caret);
      root.focus();
      publish();
    },
  }), [publish, tokens]);

  const startPillDrag = (event: DragEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const pill = pillFromEventTarget(event.target, root);
    const token = pill?.dataset.mailPlaceholder;
    if (!pill || !token || !tokens.includes(token)) return;
    event.dataTransfer.setData(MAIL_PLACEHOLDER_DRAG, token);
    event.dataTransfer.setData('text/plain', `{{${token}}}`);
    event.dataTransfer.effectAllowed = 'move';
    movingPillRef.current = pill;
    pill.classList.add('opacity-40');
  };

  const endPillDrag = () => {
    movingPillRef.current?.classList.remove('opacity-40');
    movingPillRef.current = null;
  };

  const allowDrop = (event: DragEvent<HTMLDivElement>) => {
    const types = Array.from(event.dataTransfer.types);
    if (!types.includes(MAIL_PLACEHOLDER_DRAG)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = movingPillRef.current ? 'move' : 'copy';
  };

  const dropPlaceholder = (event: DragEvent<HTMLDivElement>) => {
    const token = event.dataTransfer.getData(MAIL_PLACEHOLDER_DRAG);
    const root = rootRef.current;
    if (!root || !token || !tokens.includes(token)) return;
    event.preventDefault();
    const moving = movingPillRef.current;
    movingPillRef.current = null;
    moving?.classList.remove('opacity-40');
    // Remove first so caretRangeFromPoint lands on the surrounding text.
    if (moving && root.contains(moving)) {
      removeMailPill(moving);
    }
    const range = rangeFromPoint(event.clientX, event.clientY);
    insertMailPlaceholder(root, token, range);
    publish();
  };

  return (
    <div
      id={id}
      ref={rootRef}
      role="textbox"
      aria-labelledby={labelledBy}
      aria-multiline="true"
      contentEditable
      suppressContentEditableWarning
      tabIndex={0}
      className={cn(
        'min-h-40 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base whitespace-pre-wrap outline-none focus-visible:border-input focus-visible:ring-0 md:text-sm dark:bg-input/30'
      )}
      onInput={publish}
      onDragStart={startPillDrag}
      onDragEnd={endPillDrag}
      onDragOver={allowDrop}
      onDrop={dropPlaceholder}
    />
  );
}
