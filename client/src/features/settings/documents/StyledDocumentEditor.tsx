import { EditorContent } from '@tiptap/react';
import { DocumentValuesContext } from './DocumentValuesContext';
import type { StyledDocument } from './styledDocument';
import { useStyledDocumentEditor } from './hooks/useStyledDocumentEditor';
import { DocumentEditorToolbar } from './components/DocumentEditorToolbar';
import { DocumentFieldInsert } from './components/DocumentFieldInsert';
import { DocumentEditorZoom } from './components/DocumentEditorZoom';
import { DocumentEditorCanvas } from './components/DocumentEditorCanvas';
import { DocumentEditorCorner } from './components/DocumentEditorCorner';

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
  expanded?: boolean;
  onToggleExpanded?: () => void;
  showOriginalToggle?: boolean;
  showOriginal?: boolean;
  onToggleOriginal?: () => void;
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
  expanded = false,
  onToggleExpanded,
  showOriginalToggle = false,
  showOriginal = false,
  onToggleOriginal,
}: StyledDocumentEditorProps) {
  const { editor, zoom, setZoom, pageCount, toolbar } = useStyledDocumentEditor(
    { document, onChange, master, readOnly, section, pageView }
  );
  if (!editor || !toolbar) return null;
  const showToolbar = master && !readOnly;
  const framed = showToolbar || Boolean(onToggleExpanded);

  return (
    <DocumentValuesContext.Provider
      value={{ master, readOnly, values, onValueChange }}
    >
      <div
        className={
          framed
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-background shadow-sm'
            : 'flex min-h-0 min-w-0 flex-1 flex-col gap-2'
        }
      >
        {framed ? (
          <div className="flex shrink-0 items-start gap-2 border-b bg-muted/40 px-2 py-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {showToolbar ? (
                <>
                  <div className="flex flex-wrap items-center gap-1">
                    <DocumentEditorToolbar editor={editor} toolbar={toolbar} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-2">
                    <DocumentFieldInsert editor={editor} />
                  </div>
                </>
              ) : null}
            </div>
            {onToggleExpanded ? (
              <DocumentEditorCorner
                expanded={expanded}
                onToggleExpanded={onToggleExpanded}
                showOriginalToggle={showOriginalToggle}
                showOriginal={showOriginal}
                onToggleOriginal={onToggleOriginal}
              />
            ) : null}
          </div>
        ) : null}
        {pageView ? (
          <div className={framed ? 'px-3 pt-2' : undefined}>
            <DocumentEditorZoom
              zoom={zoom}
              onZoomChange={setZoom}
              note={showZoomNote}
            />
          </div>
        ) : null}
        <DocumentEditorCanvas
          document={document}
          values={values}
          section={section}
          pageView={pageView}
          zoom={zoom}
          pageCount={pageCount}
          flush={framed}
        >
          <EditorContent editor={editor} className="relative" />
        </DocumentEditorCanvas>
      </div>
    </DocumentValuesContext.Provider>
  );
}
