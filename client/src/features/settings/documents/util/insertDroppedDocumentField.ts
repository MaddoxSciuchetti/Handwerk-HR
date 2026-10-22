import type { EditorView } from 'prosemirror-view';
import { Fragment, Slice } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { dropPoint } from '@tiptap/pm/transform';
import { tryCatchSync } from '@/lib/trycatch';
import { FIELD_DRAG_TYPE } from '../consts/editor.consts';
import {
  getDraggedContractInput,
  setDraggedContractInput,
} from '../contractBodyDom';

type DroppedDocumentField = {
  key: string;
  label: string;
  fieldType?: string;
  required?: boolean;
  checkboxGlyph?: string;
  dateMode?: 'today' | null;
};

type DropSession = {
  master: boolean;
  readOnly: boolean;
};

export function insertDroppedDocumentField(
  view: EditorView,
  event: DragEvent,
  session: DropSession,
  fallbackToEnd = false
) {
  let dragged: DroppedDocumentField | null = getDraggedContractInput();
  const payload = event.dataTransfer?.getData(FIELD_DRAG_TYPE);
  if (payload) {
    const [parsed, error] = tryCatchSync(
      () => JSON.parse(payload) as DroppedDocumentField
    );
    if (error) return false;
    dragged = parsed;
  }
  if (!dragged || !session.master || session.readOnly) return false;
  const pos =
    view.posAtCoords({ left: event.clientX, top: event.clientY }) ??
    (fallbackToEnd ? { pos: TextSelection.atEnd(view.state.doc).from } : null);
  if (!pos) return false;
  const points = dragged.fieldType === 'points';
  const nodeType = points
    ? view.state.schema.nodes.descriptionPoints
    : view.state.schema.nodes.documentField;
  if (!nodeType) return false;
  const $pos = view.state.doc.resolve(pos.pos);
  const node = nodeType.create(
    {
      key: dragged.key,
      label: dragged.label,
      fieldType: points ? 'points' : (dragged.fieldType ?? 'text'),
      required: dragged.required ?? dragged.fieldType !== 'checkbox',
      dateMode:
        dragged.fieldType === 'date' ? (dragged.dateMode ?? null) : null,
      ...(dragged.fieldType === 'checkbox' && dragged.checkboxGlyph
        ? { checkboxGlyph: dragged.checkboxGlyph }
        : {}),
    },
    null,
    points ? undefined : $pos.marks()
  );
  // Positions are document offsets; canReplaceWith expects child indexes.
  // dropPoint also finds a valid block boundary for description points.
  const at = dropPoint(
    view.state.doc,
    pos.pos,
    new Slice(Fragment.from(node), 0, 0)
  );
  if (at === null) return false;
  const tr = view.state.tr.replaceRangeWith(at, at, node);
  tr.setSelection(TextSelection.near(tr.doc.resolve(tr.mapping.map(at, 1))));
  event.preventDefault();
  view.dispatch(tr.scrollIntoView());
  view.focus();
  setDraggedContractInput(null);
  return true;
}
