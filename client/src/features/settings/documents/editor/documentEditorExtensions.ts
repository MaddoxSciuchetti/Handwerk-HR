import StarterKit from '@tiptap/starter-kit';
import { TextStyle, FontFamily, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { TableKit } from '@tiptap/extension-table';
import Image from '@tiptap/extension-image';
import { DocumentFieldNode } from '../DocumentFieldNode';
import { editorPagination } from '../editorPagination';
import { PageBreak, PageField } from './pageNodes';
import { LineGroup, LineLabel } from './lineNodes';
import { Layout } from './documentLayout';

type PaginationLayout = {
  enabled: boolean;
  height: number;
  top: number;
  bottom: number;
  zoom: number;
};

export function documentEditorExtensions(
  paginationLayout: PaginationLayout,
  setPageCount: (count: number) => void
) {
  return [
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
  ];
}
