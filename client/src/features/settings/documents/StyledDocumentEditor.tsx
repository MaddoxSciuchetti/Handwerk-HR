import { EditorContent } from '@tiptap/react';
import { DocumentValuesContext } from './DocumentValuesContext';
import type { StyledDocument } from './styledDocument';
import { useStyledDocumentEditor } from './hooks/useStyledDocumentEditor';
import { DocumentEditorToolbar } from './components/DocumentEditorToolbar';
import { DocumentFieldInsert } from './components/DocumentFieldInsert';
import { DocumentEditorZoom } from './components/DocumentEditorZoom';
import { DocumentEditorCanvas } from './components/DocumentEditorCanvas';

type StyledDocumentEditorProps = {
  document: StyledDocument;
  onChange?: (document: StyledDocument) => void;
  values?: Record<string, string>;
  onValueChange?: (key: string, value: string) => void;
  master?: boolean;
  readOnly?: boolean;
  section?: 'content' | 'header' | 'footer';
  pageView?: boolean;
  showZoomNote?: boolean;
};

export function StyledDocumentEditor({
  document,
  onChange,
  values = {},
  onValueChange = () => undefined,
  master = false,
  readOnly = false,
  section = 'content',
  pageView = false,
  showZoomNote = true,
}: StyledDocumentEditorProps) {
  const { editor, zoom, setZoom, pageCount, toolbar } = useStyledDocumentEditor(
    { document, onChange, master, readOnly, section, pageView }
  );
  if (!editor || !toolbar) return null;

  return (
    <DocumentValuesContext.Provider
      value={{ master, readOnly, values, onValueChange }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {master && !readOnly ? (
          <details
            open={!pageView}
            className="max-h-52 shrink-0 overflow-y-auto rounded border bg-card p-2"
          >
            <summary className={pageView ? 'cursor-pointer text-sm' : 'hidden'}>
              Formatierung und Felder
            </summary>
            <div className="flex flex-wrap items-center gap-1">
              <DocumentEditorToolbar editor={editor} toolbar={toolbar} />
              <DocumentFieldInsert editor={editor} />
            </div>
          </details>
        ) : null}
        {pageView ? (
          <DocumentEditorZoom
            zoom={zoom}
            onZoomChange={setZoom}
            note={showZoomNote}
          />
        ) : null}
        <DocumentEditorCanvas
          document={document}
          values={values}
          section={section}
          pageView={pageView}
          zoom={zoom}
          pageCount={pageCount}
        >
          <EditorContent editor={editor} className="relative" />
        </DocumentEditorCanvas>
      </div>
    </DocumentValuesContext.Provider>
  );
}
