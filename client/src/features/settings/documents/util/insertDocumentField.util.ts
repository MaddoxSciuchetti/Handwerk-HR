import type { Editor } from '@tiptap/core';
import type { Mark, Schema } from '@tiptap/pm/model';

export function readableCheckboxMarks(marks: readonly Mark[], schema: Schema) {
  const style = marks.find((mark) => mark.type.name === 'textStyle');
  return schema.marks.textStyle
    .create({
      ...style?.attrs,
      fontSize: Math.max(14, Number(style?.attrs.fontSize) || 0),
    })
    .addToSet(marks);
}

export function selectedDocumentCheckbox(editor: Editor) {
  const { from, to } = editor.state.selection;
  const node = editor.state.doc.nodeAt(from);
  return to === from + 1 &&
    node?.type.name === 'documentField' &&
    node.attrs.fieldType === 'checkbox'
    ? node
    : null;
}

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
  const existing = selectedDocumentCheckbox(editor);
  const glyph =
    checkboxGlyph ??
    existing?.attrs.checkboxGlyph ??
    (/^[☐☑☒□]$/.test(selected) ? selected : '☐');
  const inheritedMarks =
    existing?.marks ?? editor.state.storedMarks ?? selection.$from.marks();
  const marks = (
    attrs.fieldType === 'checkbox'
      ? readableCheckboxMarks(inheritedMarks, editor.schema)
      : inheritedMarks
  ).map((mark) => mark.toJSON());
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
