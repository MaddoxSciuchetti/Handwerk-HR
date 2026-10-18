import { PdfSkeleton } from '@/components/ui/pdf-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/config/apiClient';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { StyledDocument } from './styledDocument';

function PrintPage({
  pdf,
  number,
  width,
  height,
}: {
  pdf: PDFDocumentProxy;
  number: number;
  width: number;
  height: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [renderedPdf, setRenderedPdf] = useState<PDFDocumentProxy | null>(null);
  const [failedPdf, setFailedPdf] = useState<PDFDocumentProxy | null>(null);
  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | undefined;
    void pdf
      .getPage(number)
      .then(async (page) => {
        if (cancelled || !canvas.current) return;
        const viewport = page.getViewport({ scale: 2 });
        canvas.current.width = viewport.width;
        canvas.current.height = viewport.height;
        task = page.render({ canvas: canvas.current, viewport });
        await (task as ReturnType<typeof page.render>).promise;
        if (!cancelled) setRenderedPdf(pdf);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Print page failed', error);
          setFailedPdf(pdf);
        }
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, number]);
  return (
    <section className="mx-auto mb-8 w-fit" aria-label={`Seite ${number}`}>
      <p className="mb-2 text-center text-xs text-muted-foreground">
        Seite {number} von {pdf.numPages}
      </p>
      <div className="relative">
        {failedPdf === pdf ? (
          <p role="alert">Druckseite konnte nicht geladen werden.</p>
        ) : renderedPdf !== pdf ? (
          <PdfSkeleton
            page={{ width: (width * 25.4) / 72, height: (height * 25.4) / 72 }}
            className="absolute inset-0 border-0 bg-card p-0"
          />
        ) : null}
        <canvas
          ref={canvas}
          aria-label={`Druckseite ${number}`}
          className="block bg-white shadow-md"
          style={{
            width: (width * 25.4) / 72 + 'mm',
            height: (height * 25.4) / 72 + 'mm',
          }}
        />
      </div>
    </section>
  );
}

export function DocumentPrintPreview({
  id,
  revision,
  document,
}: {
  id: string;
  revision: number;
  document?: StyledDocument;
}) {
  const [zoom, setZoom] = useState(100);
  const result = useQuery({
    queryKey: ['document-print-preview', id, revision, document],
    queryFn: async () => {
      let bytes: Blob;
      try {
        bytes = document
          ? await apiJson.post<Blob>(
              `/document-masters/${id}/preview.pdf`,
              { document },
              { responseType: 'blob' }
            )
          : await apiJson.get<Blob>(`/document-masters/${id}/preview.pdf`, {
              responseType: 'blob',
            });
      } catch (error) {
        const message =
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : 'PDF-Vorschau konnte nicht geladen werden.';
        throw new Error(message);
      }
      if (!(bytes instanceof Blob))
        throw new Error('PDF-Vorschau konnte nicht geladen werden.');
      const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
      const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      GlobalWorkerOptions.workerSrc = worker.default;
      const pdf = await getDocument({
        data: new Uint8Array(await bytes.arrayBuffer()),
      }).promise;
      const pages = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_, index) => {
          const page = await pdf.getPage(index + 1);
          const viewport = page.getViewport({ scale: 1 });
          return {
            number: index + 1,
            width: viewport.width,
            height: viewport.height,
          };
        })
      );
      return { pdf, pages };
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  useEffect(
    () => () => {
      void result.data?.pdf.destroy();
    },
    [result.data]
  );
  if (result.isError) {
    const detail = result.error instanceof Error ? result.error.message : '';
    return (
      <p role="alert">
        Druckvorschau konnte nicht erstellt werden.
        {detail
          ? ' ' + detail
          : ' Bitte prüfen Sie den PDF-Dienst und die Dokumentschriften.'}
      </p>
    );
  }
  if (!result.data)
    return (
      <>
        <div
          className="flex shrink-0 items-center justify-between gap-2 text-sm"
          aria-hidden="true"
        >
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-5 w-16" />
        </div>
        <PdfSkeleton
          page={document?.page}
          className="min-h-[60vh] rounded-none border-0 bg-card"
        />
      </>
    );
  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 text-sm">
        <span>
          {result.data.pdf.numPages} Druckseiten · Original-Seitenformat
        </span>
        <select
          aria-label="Druckvorschau-Zoom"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        >
          {[50, 75, 100, 125, 150].map((value) => (
            <option key={value} value={value}>
              {value}%
            </option>
          ))}
        </select>
      </div>
      <div className="min-h-[60vh] min-w-0 flex-1 overflow-auto bg-card p-4">
        <div style={{ zoom: zoom / 100 }}>
          {result.data.pages.map((page) => (
            <PrintPage key={page.number} pdf={result.data.pdf} {...page} />
          ))}
        </div>
      </div>
    </>
  );
}
