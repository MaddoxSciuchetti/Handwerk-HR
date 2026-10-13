import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';

type EditorPageLayoutArgs = {
  editor: Editor | null;
  pageView: boolean;
  zoom: number;
  section: string;
  width: number;
  height: number;
  marginTop: number;
  marginBottom: number;
};

export function useEditorPageLayout({
  editor,
  pageView,
  zoom,
  section,
  width,
  height,
  marginTop,
  marginBottom,
}: EditorPageLayoutArgs) {
  useEffect(() => {
    if (editor && pageView)
      editor.view.dispatch(editor.state.tr.setMeta('pageLayout', true));
  }, [editor, pageView, zoom, section, width, height, marginTop, marginBottom]);
}
