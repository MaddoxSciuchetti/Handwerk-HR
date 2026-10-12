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
  view.dispatch(
    view.state.tr.insert(
      pos.pos,
      view.state.schema.nodes.documentField.create({
        key: dragged.key,
        label: dragged.label,
        fieldType: dragged.fieldType ?? 'text',
        required: dragged.required ?? dragged.fieldType !== 'checkbox',
      })
    )
  );
  setDraggedContractInput(null);
  return true;
}
