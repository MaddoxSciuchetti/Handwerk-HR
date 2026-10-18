import type { Editor } from '@tiptap/core';

export function insertDocumentField(
  editor: Editor,
  attrs: {
    key: string;
    label: string;
    fieldType: string;
    required: boolean;
    checkboxGlyph?: string;
    dateMode?: 'today' | null;
  }
) {
  const { selection } = editor.state;
  const { checkboxGlyph, ...field } = attrs;
  const selected = editor.state.doc.textBetween(selection.from, selection.to);
  const glyph = /^[☐☑☒□]$/.test(selected) ? selected : (checkboxGlyph ?? '☐');
  const marks = (editor.state.storedMarks ?? selection.$from.marks()).map(
    (mark) => mark.toJSON()
  );
  return editor
    .chain()
    .focus()
    .insertContent({
      type: 'documentField',
      attrs: {
        ...field,
        ...(attrs.fieldType === 'checkbox' ? { checkboxGlyph: glyph } : {}),
      },
      marks,
    })
    .run();
}
