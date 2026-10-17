export type PreparedPdf = {
  id: string;
  previewUrl: string;
  contentHash: string;
  masterRevision: number;
  status?: string;
};

function viewerSrc(url: string, pageSized: boolean) {
  const hashIndex = url.indexOf('#');
  const base = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const params = new URLSearchParams(
    hashIndex === -1 ? '' : url.slice(hashIndex + 1)
  );
  params.set('view', 'FitH');
  params.set('zoom', 'page-width');
  params.set('toolbar', pageSized ? '0' : '1');
  params.set('navpanes', '0');
  params.set('scrollbar', '1');
  return `${base}#${params.toString()}`;
}
type PreparedPdfPreviewProps = {
  prepared: PreparedPdf;
  approved: boolean;
  onApprove: (approved: boolean) => void;
  frameTitle?: string;
  confirmLabel?: string;
  /** Paper size of the Word preview, in millimetres. */
  page?: { width: number; height: number };
};
export function PreparedPdfPreview({
  prepared,
  approved,
  onApprove,
  frameTitle = 'Finales PDF vor dem Versand',
  confirmLabel = 'Ich habe dieses PDF geprüft und bestätige den Versand.',
  page,
}: PreparedPdfPreviewProps) {
  return (
    <div
      className={
        page
          ? 'mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden'
          : 'mx-auto flex min-h-0 w-full min-w-0 max-w-3xl flex-1 flex-col gap-3 overflow-hidden'
      }
    >
      <div className="relative min-h-0 flex-1 overflow-auto rounded-lg border bg-muted shadow-sm">
        <iframe
          title={frameTitle}
          src={viewerSrc(prepared.previewUrl, Boolean(page))}
          className={
            page ? 'mx-auto block max-w-full' : 'absolute inset-0 h-full w-full'
          }
          style={
            page
              ? {
                  width: page.width + 'mm',
                  height: page.height + 'mm',
                }
              : undefined
          }
        />
      </div>
      <a
        href={prepared.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 text-sm underline"
      >
        PDF in neuem Fenster öffnen
      </a>
      {['sending', 'uncertain'].includes(prepared.status ?? '') ? (
        <p className="shrink-0 text-sm text-destructive">
          Versand läuft oder der Status ist unklar. Bitte den Postausgang prüfen
          lassen; erneuter Versand ist gesperrt.
        </p>
      ) : (
        <label className="flex shrink-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={approved}
            onChange={(event) => onApprove(event.target.checked)}
          />
          {confirmLabel}
        </label>
      )}
    </div>
  );
}
