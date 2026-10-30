import type { EditorView } from '@tiptap/pm/view';
import { Fragment, Slice, type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { canSplit } from '@tiptap/pm/transform';
import {
  LINE_LABEL_LINE_HEIGHT,
  lineGroupHeight,
} from '@shared/documentRendering';
import { DEFAULT_FONT_PT } from '../consts/editor.consts';

/** Strip Word/browser chrome so paste keeps document styles, not clipboard ones. */
export function stripPastedHtml(html: string) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(meta|link|xml|o:p|w:[^>\s]+)[^>]*>/gi, '')
    .replace(/\s(?:style|class|id|dir|lang|face|color|size|align)="[^"]*"/gi, '')
    .replace(/\s(?:style|class|id|dir|lang|face|color|size|align)='[^']*'/gi, '');
}

function plainClipboardText(event: ClipboardEvent) {
  return (event.clipboardData?.getData('text/plain') ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ');
}

function insertPlainIntoLineLabel(
  view: EditorView,
  text: string,
  event: ClipboardEvent
) {
  const { state } = view;
  const { $from, $to } = state.selection;
  if ($from.parent.type.name !== 'lineLabel' || !$from.sameParent($to))
    return false;

  const lines = text.split('\n');
  const first = lines[0] ?? '';
  let tr = state.tr.insertText(first, $from.pos, $to.pos);

  if (lines.length === 1) {
    event.preventDefault();
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  let pos = $from.pos - $from.parentOffset + first.length;
  const groupDepth = $from.depth - 1;
  if ($from.node(groupDepth).type.name !== 'lineGroup') {
    event.preventDefault();
    view.dispatch(tr.scrollIntoView());
    return true;
  }

  const groupPos = $from.before(groupDepth);
  let labelIndex = $from.index(groupDepth);
  const baseAttrs = { ...$from.parent.attrs };
  const step =
    (Number(baseAttrs.fontSize) || DEFAULT_FONT_PT) * LINE_LABEL_LINE_HEIGHT;
  let rowTop = Number(baseAttrs.top) || 0;

  for (let i = 1; i < lines.length; i += 1) {
    if (!canSplit(tr.doc, pos)) break;
    tr.split(pos);
    labelIndex += 1;
    rowTop += step;
    const group = tr.doc.nodeAt(groupPos);
    if (!group) break;
    group.forEach((label, offset, index) => {
      if (index < labelIndex) return;
      if (index === labelIndex) {
        tr.setNodeMarkup(groupPos + 1 + offset, undefined, {
          ...baseAttrs,
          top: rowTop,
        });
        return;
      }
      tr.setNodeMarkup(groupPos + 1 + offset, undefined, {
        ...label.attrs,
        top: (Number(label.attrs.top) || 0) + step,
      });
    });
    const refreshed = tr.doc.nodeAt(groupPos);
    if (refreshed) {
      tr.setNodeMarkup(groupPos, undefined, {
        ...refreshed.attrs,
        height: lineGroupHeight(refreshed.toJSON()) + step,
        labels: [],
        lines: (refreshed.attrs.lines as Record<string, unknown>[]).map(
          (line) => ({
            ...line,
            top:
              (Number(line.top) || 0) >= rowTop - step + 0.01
                ? (Number(line.top) || 0) + step
                : line.top,
          })
        ),
      });
    }
    const insertAt = pos + 2;
    if (lines[i]) tr.insertText(lines[i], insertAt);
    pos = insertAt + (lines[i]?.length ?? 0);
  }

  event.preventDefault();
  view.dispatch(
    tr.setSelection(TextSelection.create(tr.doc, pos)).scrollIntoView()
  );
  return true;
}

/** Prefer clean text in positioned lines; strip rich styles elsewhere. */
export function handleDocumentPaste(view: EditorView, event: ClipboardEvent) {
  const text = plainClipboardText(event);
  if (!text) return false;
  if (insertPlainIntoLineLabel(view, text, event)) return true;

  // Keep the current row font when pasting plain/Word text into a styled cell.
  const marks = view.state.storedMarks ?? view.state.selection.$from.marks();
  if (!marks.length) return false;
  const html = event.clipboardData?.getData('text/html') ?? '';
  if (html && !/mso-|xmlns:o=|style=/i.test(html)) return false;

  event.preventDefault();
  const { from, to } = view.state.selection;
  const inserted = text.replace(/\r\n?/g, '\n');
  let tr = view.state.tr.insertText(inserted, from, to);
  for (const mark of marks) tr = tr.addMark(from, from + inserted.length, mark);
  view.dispatch(tr.scrollIntoView());
  return true;
}

export function transformDocumentPastedHTML(html: string) {
  return stripPastedHtml(html);
}

export function transformDocumentPastedText(text: string) {
  return text.replace(/\u00a0/g, ' ');
}

/** Turn orphaned absolute line labels into normal paragraphs. */
export function transformDocumentPastedSlice(slice: Slice) {
  const paragraph = slice.content.firstChild?.type.schema.nodes.paragraph;
  if (!paragraph) return slice;

  let changed = false;
  const out: ProseMirrorNode[] = [];
  slice.content.forEach((child) => {
    if (child.type.name === 'lineLabel') {
      changed = true;
      out.push(paragraph.create(null, child.content));
      return;
    }
    out.push(child);
  });
  if (!changed) return slice;
  return new Slice(Fragment.fromArray(out), 0, 0);
}
