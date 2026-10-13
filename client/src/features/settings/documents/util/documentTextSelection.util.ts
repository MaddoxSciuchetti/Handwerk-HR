import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

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

  // Positioned text can lie outside its contentDOM's flow box. In that case
  // posAtCoords can resolve to the group boundary instead of the clicked text.
  // Map the browser's actual text caret directly into the document first.
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
  const caret = doc.caretPositionFromPoint?.(event.clientX, event.clientY);
  const range = caret
    ? null
    : doc.caretRangeFromPoint?.(event.clientX, event.clientY);
  const node = caret?.offsetNode ?? range?.startContainer;
  const offset = caret?.offset ?? range?.startOffset;
  const pos =
    node && offset !== undefined && view.dom.contains(node)
      ? view.posAtDOM(node, offset)
      : view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
  if (pos === undefined || !view.state.doc.resolve(pos).parent.isTextblock)
    return false;
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
