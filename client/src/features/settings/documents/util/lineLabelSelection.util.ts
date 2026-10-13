import { TextSelection } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

function focusLineSelection(view: EditorView, selection: TextSelection) {
  if (!view.state.selection.eq(selection))
    view.dispatch(view.state.tr.setSelection(selection));
  view.focus();
}

function placeLineCaret(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  if ($pos.parent.type.name !== 'lineLabel') return false;
  focusLineSelection(view, TextSelection.create(view.state.doc, pos));
  return true;
}

function selectLineWord(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  if ($pos.parent.type.name !== 'lineLabel') return false;
  const text = $pos.parent.textContent;
  const offset = pos - $pos.start();
  let from = offset;
  let to = offset;
  while (from > 0 && !/\s/.test(text[from - 1])) from -= 1;
  while (to < text.length && !/\s/.test(text[to])) to += 1;
  if (from === to) return placeLineCaret(view, pos);
  focusLineSelection(
    view,
    TextSelection.create(view.state.doc, $pos.start() + from, $pos.start() + to)
  );
  return true;
}

export function lineLabelClick(view: EditorView, event: Event) {
  if (!(event instanceof MouseEvent)) return false;
  const raw = event.target;
  if (!(raw instanceof Element) || !raw.closest('[data-line-label]'))
    return false;
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!pos) return false;
  event.preventDefault();
  if (event.detail > 1) selectLineWord(view, pos.pos);
  else placeLineCaret(view, pos.pos);
  return true;
}
