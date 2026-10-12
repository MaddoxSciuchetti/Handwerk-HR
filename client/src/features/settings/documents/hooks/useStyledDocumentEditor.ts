import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { DocumentFieldNode } from '../DocumentFieldNode';
import type { StyledDocument } from '../styledDocument';
import {
  getDraggedContractInput,
  setDraggedContractInput,
} from '../contractBodyDom';
import { editorPagination } from '../editorPagination';
import { PageBreak, PageField } from '../editor/pageNodes';
import { LineGroup, LineLabel } from '../editor/lineNodes';
import { Layout } from '../editor/documentLayout';
import { lineLabelClick } from '../util/lineLabelSelection.util';
import { normalizeLineLabels } from '../util/lineLayout.util';

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
  useLayoutEffect(() => {
    latest.current = { document, onChange, section, master, readOnly };
  }, [document, onChange, section, master, readOnly]);
  const [zoom, setZoom] = useState(100);
  const [pageCount, setPageCount] = useState(1);
  const [paginationLayout] = useState(() => ({
    enabled: pageView && section === 'content',
    height: document.page.height,
    top: document.page.marginTop,
    bottom: document.page.marginBottom,
    zoom: zoom / 100,
  }));
  useLayoutEffect(() => {
    Object.assign(paginationLayout, {
      enabled: pageView && section === 'content',
      height: document.page.height,
      top: document.page.marginTop,
      bottom: document.page.marginBottom,
      zoom: zoom / 100,
    });
  }, [
    paginationLayout,
    pageView,
    section,
    document.page.height,
    document.page.marginTop,
    document.page.marginBottom,
    zoom,
  ]);
  const lastPublished = useRef('');
  const [initialContent] = useState(() =>
    normalizeLineLabels(document[section])
  );
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TableKit,
      Image.configure({ allowBase64: true }),
      DocumentFieldNode,
      PageField,
      PageBreak,
      LineLabel,
      LineGroup,
      Layout,
      editorPagination(() => paginationLayout, setPageCount),
    ],
    [paginationLayout]
  );
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: master && !readOnly,
    onUpdate: ({ editor: current }) => {
      const next = current.getJSON();
      lastPublished.current = JSON.stringify(next);
      latest.current.onChange?.({
        ...latest.current.document,
        [latest.current.section]: next,
      });
    },
    editorProps: {
      handleDOMEvents: {
        mousedown: (view, event) => lineLabelClick(view, event),
      },
      handleDrop: (view, event) => {
        let dragged = getDraggedContractInput();
        const payload = event.dataTransfer?.getData('application/x-bsb-field');
        if (payload) {
          try {
            dragged = JSON.parse(payload);
          } catch {
            return false;
          }
        }
        if (
          !dragged ||
          !latest.current.onChange ||
          !latest.current.master ||
          latest.current.readOnly
        )
          return false;
        const pos = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        if (!pos) return false;
        view.dispatch(
          view.state.tr.insert(
            pos.pos,
            view.state.schema.nodes.documentField.create({
              key: dragged.key,
              label: dragged.label,
              fieldType:
                (dragged as { fieldType?: string }).fieldType ?? 'text',
              required:
                (dragged as { required?: boolean }).required ??
                (dragged as { fieldType?: string }).fieldType !== 'checkbox',
            })
          )
        );
        setDraggedContractInput(null);
        return true;
      },
    },
  });
  useEffect(() => {
    if (editor && pageView)
      editor.view.dispatch(editor.state.tr.setMeta('pageLayout', true));
  }, [
    editor,
    pageView,
    zoom,
    section,
    document.page.height,
    document.page.marginTop,
    document.page.marginBottom,
    document.page.width,
  ]);
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
  useEffect(() => {
    if (!editor) return;
    const editable = master && !readOnly;
    // setEditable emits onUpdate by default, even if nothing changed. Never
    // feed editability changes back into the controlled document state.
    if (editor.isEditable !== editable) editor.setEditable(editable, false);
  }, [editor, master, readOnly]);
  const content = document[section];
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

  return { editor, zoom, setZoom, pageCount, toolbar };
}
