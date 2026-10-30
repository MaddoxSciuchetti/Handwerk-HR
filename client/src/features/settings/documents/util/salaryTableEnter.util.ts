import type { Editor } from '@tiptap/core';
import { Mark, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';

function cellDepthAt($from: {
  depth: number;
  node: (depth: number) => { type: { name: string } };
}) {
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const name = $from.node(depth).type.name;
    if (name === 'tableCell' || name === 'tableHeader') return depth;
  }
  return -1;
}

function firstTextMarks(block: ProseMirrorNode): readonly Mark[] {
  let marks: readonly Mark[] = Mark.none;
  block.descendants((node) => {
    if (!node.isText) return;
    marks = node.marks;
    return false;
  });
  return marks;
}

function styleFromCell(cell: ProseMirrorNode) {
  const paragraph = cell.firstChild;
  if (!paragraph || paragraph.type.name !== 'paragraph') {
    return {
      cellAttrs: cell.attrs,
      paragraphAttrs: { textAlign: 'left' as string | null },
      marks: Mark.none,
    };
  }
  const marks = firstTextMarks(paragraph);
  const textStyle = marks.find((mark) => mark.type.name === 'textStyle');
  const fontSize = textStyle?.attrs?.fontSize ?? paragraph.attrs.fontSize;
  return {
    cellAttrs: cell.attrs,
    paragraphAttrs: {
      ...paragraph.attrs,
      ...(fontSize != null && fontSize !== ''
        ? { fontSize: Number(fontSize) || fontSize }
        : {}),
    },
    marks,
  };
}

/** Enter in a right amount cell: new styled row, caret in the left label cell. */
export function insertStyledSalaryRowAfter(editor: Editor) {
  const { $from, empty } = editor.state.selection;
  if (!empty) return false;
  const depth = cellDepthAt($from);
  if (depth < 0) return false;
  const row = $from.node(depth - 1);
  if (row.type.name !== 'tableRow' || row.childCount < 2) return false;
  if ($from.index(depth - 1) !== row.childCount - 1) return false;
  const align = $from.parent.attrs.textAlign;
  if (align !== 'right' && align !== 'center') return false;
  if (!editor.can().addRowAfter()) return false;

  const styles = Array.from({ length: row.childCount }, (_, index) =>
    styleFromCell(row.child(index))
  );
  const leftMarks = styles[0]?.marks ?? Mark.none;

  if (!editor.chain().addRowAfter().goToNextCell().run()) return false;

  const selection = editor.state.selection;
  const newDepth = cellDepthAt(selection.$from);
  if (newDepth < 0) return true;
  const newRowPos = selection.$from.before(newDepth - 1);
  const newRow = editor.state.doc.nodeAt(newRowPos);
  if (!newRow || newRow.type.name !== 'tableRow') return true;

  let tr = editor.state.tr;
  newRow.forEach((cell, offset, index) => {
    const style = styles[index];
    if (!style) return;
    const cellPos = newRowPos + 1 + offset;
    tr = tr.setNodeMarkup(cellPos, undefined, {
      ...cell.attrs,
      colwidth: style.cellAttrs.colwidth ?? cell.attrs.colwidth,
    });
    const paragraph = tr.doc.nodeAt(cellPos)?.firstChild;
    if (!paragraph || paragraph.type.name !== 'paragraph') return;
    tr = tr.setNodeMarkup(cellPos + 1, undefined, {
      ...paragraph.attrs,
      ...style.paragraphAttrs,
    });
  });

  const leftCellPos = newRowPos + 1;
  const leftParagraph = tr.doc.nodeAt(leftCellPos)?.firstChild;
  const caret = leftParagraph
    ? leftCellPos + 2
    : selection.from;
  tr = tr
    .setSelection(TextSelection.create(tr.doc, caret))
    .setStoredMarks(leftMarks.length ? [...leftMarks] : null)
    .scrollIntoView();
  editor.view.dispatch(tr);
  return true;
}

export { cellDepthAt };
