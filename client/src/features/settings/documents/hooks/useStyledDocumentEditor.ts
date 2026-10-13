import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useEditor, useEditorState } from '@tiptap/react';
import type { StyledDocument } from '../styledDocument';
import { lineLabelClick } from '../util/lineLabelSelection.util';
import { normalizeLineLabels } from '../util/lineLayout.util';
import { insertDroppedDocumentField } from '../util/insertDroppedDocumentField';
import { documentEditorExtensions } from '../editor/documentEditorExtensions';
import { usePaginationLayout } from './usePaginationLayout';
import { useEditorEditable } from './useEditorEditable';
import { useEditorPageLayout } from './useEditorPageLayout';
import { useEditorContentSync } from './useEditorContentSync';

type UseStyledDocumentEditorArgs = {
  document: StyledDocument;
  onChange?: (document: StyledDocument) => void;
  master: boolean;
  readOnly: boolean;
  section: 'content' | 'header' | 'footer';
  pageView: boolean;
};

export function useStyledDocumentEditor({
  document,
  onChange,
  master,
  readOnly,
  section,
  pageView,
}: UseStyledDocumentEditorArgs) {
  const latest = useRef({ document, onChange, section, master, readOnly });
  const publishRef = useRef<(next: unknown) => void>(() => undefined);
  useLayoutEffect(() => {
    latest.current = { document, onChange, section, master, readOnly };
  }, [document, onChange, section, master, readOnly]);
  const { zoom, setZoom, pageCount, setPageCount, paginationLayout } =
    usePaginationLayout({ pageView, section, page: document.page });
  const [initialContent] = useState(() =>
    normalizeLineLabels(document[section])
  );
  const extensions = useMemo(
    () => documentEditorExtensions(paginationLayout, setPageCount),
    [paginationLayout, setPageCount]
  );
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: master && !readOnly,
    onUpdate: ({ editor: current }) => {
      const next = current.getJSON();
      publishRef.current(next);
      latest.current.onChange?.({
        ...latest.current.document,
        [latest.current.section]: next,
      });
    },
    editorProps: {
      handleDOMEvents: {
        mousedown: (view, event) => lineLabelClick(view, event),
      },
      handleDrop: (view, event) =>
        insertDroppedDocumentField(view, event, latest.current),
    },
  });
  const publish = useEditorContentSync(editor, document[section]);
  useLayoutEffect(() => {
    publishRef.current = publish;
  }, [publish]);
  useEditorEditable(editor, master && !readOnly);
  useEditorPageLayout({
    editor,
    pageView,
    zoom,
    section,
    width: document.page.width,
    height: document.page.height,
    marginTop: document.page.marginTop,
    marginBottom: document.page.marginBottom,
  });
  const toolbar = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      fontFamily:
        current?.getAttributes('textStyle').fontFamily ??
        document.page.fontFamily,
      fontSize:
        current?.getAttributes('textStyle').fontSize ??
        current?.getAttributes('paragraph').fontSize ??
        document.page.fontSize,
      alignment:
        current?.getAttributes('paragraph').textAlign ??
        current?.getAttributes('heading').textAlign ??
        'left',
      orderedListStart: current?.isActive('orderedList')
        ? (current.getAttributes('orderedList').start ?? 1)
        : null,
    }),
  });

  return { editor, zoom, setZoom, pageCount, toolbar };
}
