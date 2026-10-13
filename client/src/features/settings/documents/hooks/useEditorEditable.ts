import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

export function useEditorEditable(editor: Editor | null, editable: boolean) {
  useEffect(() => {
    if (!editor) return;
    // setEditable emits onUpdate by default, even if nothing changed. Never
    // feed editability changes back into the controlled document state.
    if (editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, editable]);
}
