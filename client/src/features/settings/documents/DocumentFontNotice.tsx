export type DocumentFontStatus = {
  ready: boolean;
  available: string[];
  substitute?: string | null;
};

export function DocumentFontNotice({ status }: { status?: DocumentFontStatus }) {
  if (!status) return null;
  if (!status.ready)
    return (
      <p role="status" className="shrink-0 text-xs text-destructive">
        Calibri-Dateien fehlen. Die Vorschau nutzt Ersatzschriften, deshalb
        stimmen Laufweite und Zeilenumbruch nicht mit dem Original überein.
        Legen Sie die lizenzierten Dateien Calibri.ttf, Calibri-Bold.ttf und
        Calibri-Italic.ttf in den Ordner aus DOCUMENT_FONT_DIR. PDF-Versand
        bleibt gesperrt, bis diese Dateien vorliegen.
      </p>
    );
  if (status.substitute)
    return (
      <p role="status" className="shrink-0 text-xs text-muted-foreground">
        Calibri wird durch {status.substitute} ersetzt. Laufweite und
        Zeilenumbruch entsprechen dem Original, die Buchstabenformen weichen
        leicht ab.
      </p>
    );
  return null;
}
