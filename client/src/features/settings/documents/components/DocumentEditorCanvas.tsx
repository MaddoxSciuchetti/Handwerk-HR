import type { ReactNode } from 'react';
import { renderNode } from '@shared/documentRendering';
import { PAGE_SHEET_GAP_PX } from '../consts/editor.consts';
import type { StyledDocument } from '../styledDocument';

type DocumentSection = 'content' | 'header' | 'footer';

type DocumentEditorCanvasProps = {
  document: StyledDocument;
  values: Record<string, string>;
  section: DocumentSection;
  pageView: boolean;
  zoom: number;
  pageCount: number;
  children: ReactNode;
};

export function DocumentEditorCanvas({
  document,
  values,
  section,
  pageView,
  zoom,
  pageCount,
  children,
}: DocumentEditorCanvasProps) {
  const pageSheets =
    pageView && section === 'content'
      ? Array.from({ length: pageCount }, (_, index) => index)
      : [];

  return (
    <div
      className={
        pageView
          ? 'document-editor-canvas min-h-0 min-w-0 flex-1 overflow-auto rounded border bg-muted p-4'
          : 'styled-document min-h-0 flex-1 overflow-auto rounded border p-5'
      }
    >
      <div
        className={
          pageView
            ? `styled-document document-editor-paper${section === 'content' ? ' document-editor-paginated' : ''}`
            : undefined
        }
        style={{
          fontFamily: document.page.fontFamily,
          fontSize: document.page.fontSize + 'pt',
          ...(pageView
            ? {
                zoom: zoom / 100,
                width: document.page.width + 'mm',
                maxWidth: 'none',
                flexShrink: 0,
                position: 'relative' as const,
                minHeight:
                  section === 'content'
                    ? `calc(${document.page.height * pageCount}mm + ${(pageCount - 1) * PAGE_SHEET_GAP_PX}px)`
                    : '70mm',
                padding: `${document.page.marginTop}mm ${document.page.marginRight}mm ${document.page.marginBottom}mm ${document.page.marginLeft}mm`,
              }
            : {}),
        }}
      >
        {pageSheets.map((index) => (
          <div
            key={index}
            className="document-editor-page-sheet"
            aria-label={`Editorseite ${index + 1}`}
            style={{
              top: `calc(${index * document.page.height}mm + ${index * PAGE_SHEET_GAP_PX}px)`,
              height: document.page.height + 'mm',
            }}
          >
            <div
              className="document-editor-page-header"
              style={{
                left: document.page.marginLeft + 'mm',
                right: document.page.marginRight + 'mm',
              }}
              dangerouslySetInnerHTML={{
                __html: renderNode(document.header, values),
              }}
            />
            <div
              className="document-editor-page-footer"
              style={{
                left: document.page.marginLeft + 'mm',
                right: document.page.marginRight + 'mm',
              }}
              dangerouslySetInnerHTML={{
                __html: renderNode(document.footer, values)
                  .replaceAll('‹Seite›', String(index + 1))
                  .replaceAll('‹Seiten›', String(pageCount)),
              }}
            />
            <span className="document-editor-page-label">
              Seite {index + 1} von {pageCount}
            </span>
          </div>
        ))}
        {children}
      </div>
    </div>
  );
}
