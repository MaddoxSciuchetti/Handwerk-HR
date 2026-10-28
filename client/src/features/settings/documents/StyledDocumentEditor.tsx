import { DocumentEditorSkeleton } from './components/DocumentEditorSkeleton';
import { EditorContent } from '@tiptap/react';
import { DocumentValuesContext } from './DocumentValuesContext';
import type { StyledDocument } from './styledDocument';
import { useStyledDocumentEditor } from './hooks/useStyledDocumentEditor';
import { DocumentEditorToolbar } from './components/DocumentEditorToolbar';
import { DocumentFieldInsert } from './components/DocumentFieldInsert';
import { DocumentEditorZoom } from './components/DocumentEditorZoom';
import { DocumentEditorCanvas } from './components/DocumentEditorCanvas';
import { DocumentEditorCorner } from './components/DocumentEditorCorner';
import { insertDroppedDocumentField } from './util/insertDroppedDocumentField';
import { documentCheckboxChoices } from './util/documentCheckboxChoices';

type StyledDocumentEditorProps = {
  document: StyledDocument;
  onChange?: (document: StyledDocument) => void;
  values?: Record<string, string>;
  onValueChange?: (key: string, value: string) => void;
  master?: boolean;
  readOnly?: boolean;
  section?: 'content' | 'header' | 'footer';
  pageView?: boolean;
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
  expanded = false,
  onToggleExpanded,
  showOriginalToggle = false,
  showOriginal = false,
  onToggleOriginal,
}: StyledDocumentEditorProps) {
  const { editor, zoom, setZoom, pageCount, toolbar } = useStyledDocumentEditor(
    { document, onChange, master, readOnly, section, pageView }
  );
  if (!editor || !toolbar)
    return (
      <DocumentEditorSkeleton
        document={document}
        master={master}
        readOnly={readOnly}
        section={section}
        pageView={pageView}
        showCorner={Boolean(onToggleExpanded)}
        showOriginalToggle={showOriginalToggle}
      />
    );
  const showToolbar = master && !readOnly;
  const framed = showToolbar || Boolean(onToggleExpanded);
  const changeValue = (key: string, value: string) => {
    if (value === 'true') {
      for (const group of documentCheckboxChoices(document)) {
        if (group.includes(key)) {
          for (const other of group)
            if (other !== key) onValueChange(other, 'false');
        }
      }
    }
    onValueChange(key, value);
  };

  return (
    <DocumentValuesContext.Provider
      value={{ master, readOnly, values, onValueChange: changeValue }}
    >
      <div
        className={
          framed
            ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-card'
            : 'flex min-h-0 min-w-0 flex-1 flex-col gap-2'
        }
      >
        {framed ? (
          <div className="flex shrink-0 items-start gap-2 bg-card px-2 py-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {showToolbar ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <DocumentEditorToolbar editor={editor} toolbar={toolbar} />
                </div>
              ) : null}
              {showToolbar ? <DocumentFieldInsert editor={editor} /> : null}
            </div>
            {pageView ? (
              <DocumentEditorZoom zoom={zoom} onZoomChange={setZoom} />
            ) : null}
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
        {pageView && !framed ? (
          <div>
            <DocumentEditorZoom zoom={zoom} onZoomChange={setZoom} />
          </div>
        ) : null}
        <DocumentEditorCanvas
          document={document}
          values={values}
          section={section}
          pageView={pageView}
          zoom={zoom}
          pageCount={pageCount}
          onFieldDrop={
            showToolbar
              ? (event) => {
                  if (!event.defaultPrevented)
                    insertDroppedDocumentField(
                      editor.view,
                      event.nativeEvent,
                      { master, readOnly },
                      true
                    );
                }
              : undefined
          }
        >
          <EditorContent editor={editor} className="relative" />
        </DocumentEditorCanvas>
      </div>
    </DocumentValuesContext.Provider>
  );
}
