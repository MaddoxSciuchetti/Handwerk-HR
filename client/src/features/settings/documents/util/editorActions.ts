import type { Editor } from '@tiptap/react';
import {
  DEFAULT_TABLE_COLUMNS,
  DEFAULT_TABLE_ROWS,
  LONG_PARAGRAPH_LENGTH,
} from '../consts/editor.consts';

function alignLongCenteredParagraphs(editor: Editor) {
  editor
    .chain()
    .focus()
    .command(({ tr }) => {
      tr.doc.descendants((node, pos, parent) => {
        if (
          node.type.name === 'paragraph' &&
          node.attrs.textAlign === 'center' &&
          node.textContent.length >= LONG_PARAGRAPH_LENGTH &&
          !['tableCell', 'tableHeader'].includes(parent?.type.name ?? '')
        ) {
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            textAlign: 'left',
          });
        }
      });
      return true;
    })
    .run();
}

export function documentEditorActions(editor: Editor) {
  return [
    { label: 'Fett', run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Kursiv', run: () => editor.chain().focus().toggleItalic().run() },
    {
      label: 'Unterstrichen',
      run: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      label: 'Liste',
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Nummeriert',
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: 'Tabelle',
      run: () =>
        editor
          .chain()
          .focus()
          .insertTable({
            rows: DEFAULT_TABLE_ROWS,
            cols: DEFAULT_TABLE_COLUMNS,
            withHeaderRow: true,
          })
          .run(),
    },
    {
      label: 'Seitenumbruch',
      run: () =>
        editor.chain().focus().insertContent({ type: 'pageBreak' }).run(),
    },
    { label: 'Zeile +', run: () => editor.chain().focus().addRowAfter().run() },
    {
      label: 'Spalte +',
      run: () => editor.chain().focus().addColumnAfter().run(),
    },
    {
      label: 'Zeile entfernen',
      run: () => editor.chain().focus().deleteRow().run(),
    },
    {
      label: 'Spalte entfernen',
      run: () => editor.chain().focus().deleteColumn().run(),
    },
    {
      label: 'Tabelle entfernen',
      run: () => editor.chain().focus().deleteTable().run(),
    },
    { label: 'Rückgängig', run: () => editor.chain().focus().undo().run() },
    {
      label: 'Fließtext linksbündig',
      run: () => alignLongCenteredParagraphs(editor),
    },
    {
      label: 'Alles linksbündig',
      run: () => {
        const { from, to } = editor.state.selection;
        editor
          .chain()
          .focus()
          .selectAll()
          .setTextAlign('left')
          .setTextSelection({ from, to })
          .run();
      },
    },
  ];
}
