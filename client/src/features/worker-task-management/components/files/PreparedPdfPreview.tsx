export type PreparedPdf = {
  id: string;
  previewUrl: string;
  contentHash: string;
  masterRevision: number;
  status?: string;
};
type PreparedPdfPreviewProps = {
  prepared: PreparedPdf;
  approved: boolean;
  onApprove: (approved: boolean) => void;
};
export function PreparedPdfPreview({
  prepared,
  approved,
  onApprove,
}: PreparedPdfPreviewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <iframe
        title="Finales PDF vor dem Versand"
        src={prepared.previewUrl}
        className="min-h-80 w-full flex-1 rounded border"
      />
      <a
        href={prepared.previewUrl}
        target="_blank"
        rel="noreferrer"
        className="text-sm underline"
      >
        PDF in neuem Fenster öffnen
      </a>
      {['sending', 'uncertain'].includes(prepared.status ?? '') ? (
        <p className="text-sm text-destructive">
          Versand läuft oder der Status ist unklar. Bitte den Postausgang prüfen
          lassen; erneuter Versand ist gesperrt.
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={approved}
            onChange={(event) => onApprove(event.target.checked)}
          />
          Ich habe dieses PDF geprüft und bestätige den Versand.
        </label>
      )}
    </div>
  );
}
