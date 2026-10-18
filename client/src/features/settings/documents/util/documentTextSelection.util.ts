import { Extension } from '@tiptap/core';
import { Plugin, TextSelection } from 'prosemirror-state';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';

const mouseStarts = new WeakMap<
  EditorView,
  {
    dragged?: boolean;
    x: number;
    y: number;
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
  }
>();

const dragCleanups = new WeakMap<EditorView, () => void>();

function textPositionAtPoint(view: EditorView, x: number, y: number) {
  const doc = view.dom.ownerDocument as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => {
      offsetNode: Node;
      offset: number;
    } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const caret = doc.caretPositionFromPoint?.(x, y);
  const range = caret ? null : doc.caretRangeFromPoint?.(x, y);
  const node = caret?.offsetNode ?? range?.startContainer;
  const offset = caret?.offset ?? range?.startOffset;
  const pos =
    node && offset !== undefined && view.dom.contains(node)
      ? view.posAtDOM(node, offset)
      : view.posAtCoords({ left: x, top: y })?.pos;
  return pos !== undefined && view.state.doc.resolve(pos).parent.isTextblock
    ? pos
    : undefined;
}

export function documentTextPointerDown(view: EditorView, event: Event) {
  dragCleanups.get(view)?.();
  if (!(event instanceof MouseEvent) || event.button !== 0 || !view.editable)
    return false;
  const selection = view.dom.ownerDocument.getSelection();
  const start = {
    x: event.clientX,
    y: event.clientY,
    dragged: false,
    anchorNode: selection?.anchorNode ?? null,
    anchorOffset: selection?.anchorOffset ?? 0,
    focusNode: selection?.focusNode ?? null,
    focusOffset: selection?.focusOffset ?? 0,
  };
  mouseStarts.set(view, start);
  const target = event.target;
  if (
    !(target instanceof Element) ||
    target.closest('input, textarea, button, [contenteditable="false"]') ||
    view.dom.classList.contains('resize-cursor') ||
    event.detail > 1 ||
    event.altKey ||
    event.metaKey ||
    event.ctrlKey
  )
    return false;
  const pos = textPositionAtPoint(view, event.clientX, event.clientY);
  if (pos === undefined) return false;
  const anchor = event.shiftKey ? view.state.selection.anchor : pos;
  const doc = view.dom.ownerDocument;
  const move = (next: MouseEvent) => {
    if (view.isDestroyed || !(next.buttons & 1)) return;
    if (
      Math.abs(next.clientX - start.x) < 1 &&
      Math.abs(next.clientY - start.y) < 1
    )
      return;
    const head = textPositionAtPoint(view, next.clientX, next.clientY);
    if (head === undefined) return;
    start.dragged = true;
    focusTextSelection(
      view,
      TextSelection.create(view.state.doc, anchor, head)
    );
    next.preventDefault();
  };
  const cleanup = () => {
    doc.removeEventListener('mousemove', move, true);
    doc.removeEventListener('mouseup', cleanup, true);
    doc.defaultView?.removeEventListener('blur', cleanup);
    dragCleanups.delete(view);
  };
  dragCleanups.set(view, cleanup);
  doc.addEventListener('mousemove', move, true);
  doc.addEventListener('mouseup', cleanup, true);
  doc.defaultView?.addEventListener('blur', cleanup);
  focusTextSelection(view, TextSelection.create(view.state.doc, anchor, pos));
  event.preventDefault();
  return true;
}

function focusTextSelection(view: EditorView, selection: TextSelection) {
  if (!view.state.selection.eq(selection))
    view.dispatch(view.state.tr.setSelection(selection));
  if (!view.hasFocus()) view.focus();
}

function placeTextCaret(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  if (!$pos.parent.isTextblock) return false;
  focusTextSelection(view, TextSelection.create(view.state.doc, pos));
  return true;
}

function selectTextWord(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  if (!$pos.parent.isTextblock) return false;
  // Keep model offsets aligned across inline fields and hard breaks.
  const text = $pos.parent.textBetween(
    0,
    $pos.parent.content.size,
    '',
    '\ufffc'
  );
  const offset = pos - $pos.start();
  let from = offset;
  let to = offset;
  const wordCharacter = /[\p{L}\p{N}\p{M}_]/u;
  if (
    !wordCharacter.test(text[offset] ?? '') &&
    wordCharacter.test(text[offset - 1] ?? '')
  )
    from = to = offset - 1;
  while (from > 0 && wordCharacter.test(text[from - 1])) from -= 1;
  while (to < text.length && wordCharacter.test(text[to])) to += 1;
  if (from === to) return placeTextCaret(view, pos);
  focusTextSelection(
    view,
    TextSelection.create(view.state.doc, $pos.start() + from, $pos.start() + to)
  );
  return true;
}

export function documentTextClick(view: EditorView, event: MouseEvent) {
  if (!view.editable || event.button !== 0) return false;
  const raw = event.target;
  if (!(raw instanceof Element)) return false;
  if (
    !view.dom.contains(raw) ||
    raw.closest('input, textarea, [contenteditable="false"]')
  )
    return false;

  const start = mouseStarts.get(view);
  mouseStarts.delete(view);
  if (start?.dragged) {
    event.preventDefault();
    return true;
  }
  const dragged =
    start &&
    (Math.abs(event.clientX - start.x) >= 1 ||
      Math.abs(event.clientY - start.y) >= 1);

  // Preserve a range only when the pointer actually moved. A stationary click
  // inside selected text must collapse the old highlight to the clicked caret.
  const selection = view.dom.ownerDocument.getSelection();
  const rangeChanged =
    start &&
    selection &&
    (selection.anchorNode !== start.anchorNode ||
      selection.anchorOffset !== start.anchorOffset ||
      selection.focusNode !== start.focusNode ||
      selection.focusOffset !== start.focusOffset);
  if (
    dragged &&
    rangeChanged &&
    selection &&
    !selection.isCollapsed &&
    selection.anchorNode &&
    selection.focusNode &&
    view.dom.contains(selection.anchorNode) &&
    view.dom.contains(selection.focusNode)
  ) {
    const anchor = view.posAtDOM(selection.anchorNode, selection.anchorOffset);
    const head = view.posAtDOM(selection.focusNode, selection.focusOffset);
    if (
      view.state.doc.resolve(anchor).parent.isTextblock &&
      view.state.doc.resolve(head).parent.isTextblock
    ) {
      focusTextSelection(
        view,
        TextSelection.create(view.state.doc, anchor, head)
      );
      event.preventDefault();
      return true;
    }
  }

  // Positioned text can lie outside its contentDOM's flow box. In that case
  // posAtCoords can resolve to the group boundary instead of the clicked text.
  // Map the browser's actual text caret directly into the document first.
  const pos = textPositionAtPoint(view, event.clientX, event.clientY);
  if (pos === undefined) return false;
  let handled: boolean;
  if (event.shiftKey) {
    focusTextSelection(
      view,
      TextSelection.create(view.state.doc, view.state.selection.anchor, pos)
    );
    handled = true;
  } else {
    handled =
      event.detail > 1 ? selectTextWord(view, pos) : placeTextCaret(view, pos);
  }
  if (handled) event.preventDefault();
  return handled;
}

const verticalCarets = new WeakMap<
  EditorView,
  { selection: TextSelection; x: number }
>();

function verticalTextCaret(view: EditorView, down: boolean) {
  const selection = view.state.selection;
  if (!(selection instanceof TextSelection)) return undefined;
  const current = view.coordsAtPos(selection.head);
  const previous = verticalCarets.get(view);
  const x = previous?.selection === selection ? previous.x : current.left;
  const y = (current.top + current.bottom) / 2;
  let best: { pos: number; dy: number; dx: number } | undefined;
  // Use rendered caret positions so lists, wrapped text, tables and imported
  // positioned labels follow their visual rows, including field-only rows.
  view.state.doc.descendants((node, pos) => {
    if (!node.isTextblock) return;
    const dom = view.nodeDOM(pos);
    if (dom instanceof Element) {
      const rect = dom.getBoundingClientRect();
      if (rect.height > 0) {
        const near = down ? rect.top - y : y - rect.bottom;
        const far = down ? rect.bottom - y : y - rect.top;
        if (far <= 1 || (best && near > best.dy + 1)) return false;
      }
    }
    for (let offset = 0; offset <= node.content.size; offset += 1) {
      const caret = view.coordsAtPos(pos + 1 + offset);
      const dy = ((caret.top + caret.bottom) / 2 - y) * (down ? 1 : -1);
      if (dy <= 1) continue;
      const dx = Math.abs(caret.left - x);
      if (
        !best ||
        dy < best.dy - 1 ||
        (Math.abs(dy - best.dy) <= 1 && dx < best.dx)
      )
        best = { pos: pos + 1 + offset, dy, dx };
    }
    return false;
  });
  return best ? { head: best.pos, x } : undefined;
}

// Handle motion in the document model: native movement can stop at the
// contenteditable=false wrappers of inline fields, especially in placed labels.
export function documentTextKeyDown(view: EditorView, event: KeyboardEvent) {
  if (
    !view.editable ||
    event.isComposing ||
    !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
  )
    return false;
  const selection = view.state.selection;
  if (!(selection instanceof TextSelection)) return false;
  if (event.metaKey) {
    if (event.altKey || event.ctrlKey) return false;
    verticalCarets.delete(view);
    let head: number;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      head = (
        event.key === 'ArrowUp'
          ? TextSelection.atStart(view.state.doc)
          : TextSelection.atEnd(view.state.doc)
      ).head;
    } else {
      const right = event.key === 'ArrowRight';
      const current = view.coordsAtPos(selection.head);
      const y = (current.top + current.bottom) / 2;
      const { $head } = selection;
      head = $head.pos;
      let edge = current.left;
      for (let offset = 0; offset <= $head.parent.content.size; offset += 1) {
        const pos = $head.start() + offset;
        const caret = view.coordsAtPos(pos);
        if (Math.abs((caret.top + caret.bottom) / 2 - y) > 1) continue;
        if (right ? caret.left >= edge : caret.left <= edge) {
          head = pos;
          edge = caret.left;
        }
      }
    }
    view.dispatch(
      view.state.tr
        .setSelection(
          TextSelection.create(
            view.state.doc,
            event.shiftKey ? selection.anchor : head,
            head
          )
        )
        .scrollIntoView()
    );
    event.preventDefault();
    return true;
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (event.altKey || event.ctrlKey) return false;
    const target = verticalTextCaret(view, event.key === 'ArrowDown');
    if (!target) return false;
    const next = TextSelection.create(
      view.state.doc,
      event.shiftKey ? selection.anchor : target.head,
      target.head
    );
    view.dispatch(view.state.tr.setSelection(next).scrollIntoView());
    verticalCarets.set(view, { selection: next, x: target.x });
    event.preventDefault();
    return true;
  }
  verticalCarets.delete(view);
  const mac = /Mac|iPhone|iPad/.test(
    view.dom.ownerDocument.defaultView?.navigator.platform ?? ''
  );
  const wordMotion =
    (event.altKey && !event.ctrlKey) ||
    (event.ctrlKey && !event.altKey && !mac);
  if ((event.altKey || event.ctrlKey) && !wordMotion) return false;
  const right = event.key === 'ArrowRight';
  const $head = selection.$head;
  const text = $head.parent.textBetween(
    0,
    $head.parent.content.size,
    '',
    '\ufffc'
  );
  let offset = $head.parentOffset;
  const word = /[\p{L}\p{N}\p{M}_]/u;
  const char = (index: number) => (right ? text[index] : text[index - 1]);
  const step = right ? 1 : -1;
  // Word motion skips separators (including punctuation), but treats each
  // inline field as a single stop instead of entering its rendered label.
  if (wordMotion) {
    while (
      char(offset) &&
      !word.test(char(offset)) &&
      char(offset) !== '\ufffc'
    )
      offset += step;
    if (char(offset) === '\ufffc') offset += step;
    else while (char(offset) && word.test(char(offset))) offset += step;
  } else if (char(offset)) {
    // Keep surrogate pairs together when moving one character.
    const character = right
      ? [...text.slice(offset)][0]
      : [...text.slice(0, offset)].at(-1);
    offset += step * (character?.length ?? 1);
  }
  let head = $head.start() + offset;
  if (!wordMotion && !event.shiftKey && !selection.empty)
    head = right ? selection.to : selection.from;
  if (head === $head.pos && (selection.empty || wordMotion || event.shiftKey)) {
    const next = TextSelection.findFrom(
      view.state.doc.resolve(right ? $head.after() : $head.before()),
      step,
      true
    );
    if (next) head = next.head;
  }
  const anchor = event.shiftKey ? selection.anchor : head;
  view.dispatch(
    view.state.tr
      .setSelection(TextSelection.create(view.state.doc, anchor, head))
      .scrollIntoView()
  );
  event.preventDefault();
  return true;
}

export const DocumentTextSelection = Extension.create({
  name: 'documentTextSelection',
  priority: 1000,
  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        props: {
          // The browser hides its native range when a toolbar input takes focus.
          // Decorate the live model selection so it remains visible while editing
          // field details, without storing a stale range or changing the document.
          decorations(state) {
            const { selection } = state;
            if (
              !editor.isEditable ||
              editor.isFocused ||
              !(selection instanceof TextSelection) ||
              selection.empty
            )
              return DecorationSet.empty;
            return DecorationSet.create(state.doc, [
              Decoration.inline(selection.from, selection.to, {
                class: 'document-retained-selection',
              }),
            ]);
          },
          handleDOMEvents: { mousedown: documentTextPointerDown },
          handleClick: (view, _pos, event) => documentTextClick(view, event),
          handleDoubleClick: (view, _pos, event) =>
            documentTextClick(view, event),
          handleKeyDown: documentTextKeyDown,
        },
        view: (view) => ({ destroy: () => dragCleanups.get(view)?.() }),
      }),
    ];
  },
});
