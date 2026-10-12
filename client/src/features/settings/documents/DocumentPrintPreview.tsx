import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiJson } from '@/config/apiClient';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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
      })
      .catch((error) => {
        if (!cancelled) console.error('Print page failed', error);
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
      <canvas
        ref={canvas}
        aria-label={`Druckseite ${number}`}
        className="block bg-white shadow-md"
        style={{
          width: (width * 25.4) / 72 + 'mm',
          height: (height * 25.4) / 72 + 'mm',
        }}
      />
    </section>
  );
}

export function DocumentPrintPreview({
  id,
  revision,
}: {
  id: string;
  revision: number;
}) {
  const [zoom, setZoom] = useState(100);
  const result = useQuery({
    queryKey: ['document-print-preview', id, revision],
    queryFn: async () => {
      const bytes = await apiJson.get<Blob>(
        `/document-masters/${id}/preview.pdf`,
        { responseType: 'blob' }
      );
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
  if (result.isError)
    return (
      <p role="alert">
        Druckvorschau konnte nicht erstellt werden. Bitte prüfen Sie den
        PDF-Dienst und die Dokumentschriften.
      </p>
    );
  if (!result.data) return <p role="status">Druckseiten werden erstellt…</p>;
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
      <div className="min-h-[60vh] min-w-0 flex-1 overflow-auto rounded border bg-muted p-4">
        <div style={{ zoom: zoom / 100 }}>
          {result.data.pages.map((page) => (
            <PrintPage key={page.number} pdf={result.data.pdf} {...page} />
          ))}
        </div>
      </div>
    </>
  );
}
