import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { normalizeLineLabels } from '../util/lineLayout.util';

export function useEditorContentSync(editor: Editor | null, content: unknown) {
  const lastPublished = useRef('');
  const publish = (next: unknown) => {
    lastPublished.current = JSON.stringify(next);
  };
  useEffect(() => {
    if (!editor) return;
    const incoming = normalizeLineLabels(content);
    const json = JSON.stringify(incoming);
    if (
      json !== lastPublished.current &&
      !editor.state.doc.eq(editor.schema.nodeFromJSON(incoming))
    )
      editor.commands.setContent(incoming, { emitUpdate: false });
  }, [editor, content]);

  return publish;
}
