import type { EditorView } from 'prosemirror-view';
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
};

type DropSession = {
  onChange?: (document: unknown) => void;
  master: boolean;
  readOnly: boolean;
};

export function insertDroppedDocumentField(
  view: EditorView,
  event: DragEvent,
  session: DropSession
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
  if (!dragged || !session.onChange || !session.master || session.readOnly)
    return false;
  const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!pos) return false;
  const points = dragged.fieldType === 'points';
  const nodeType = points
    ? view.state.schema.nodes.descriptionPoints
    : view.state.schema.nodes.documentField;
  const node = nodeType.create({
    key: dragged.key,
    label: dragged.label,
    fieldType: points ? 'points' : (dragged.fieldType ?? 'text'),
    required: dragged.required ?? dragged.fieldType !== 'checkbox',
  });
  const $pos = view.state.doc.resolve(pos.pos);
  const at = !points || $pos.parent.type.name === 'doc' ? pos.pos : $pos.after(1);
  if (!view.state.doc.canReplaceWith(at, at, node.type)) return false;
  view.dispatch(view.state.tr.insert(at, node));
  setDraggedContractInput(null);
  return true;
}
