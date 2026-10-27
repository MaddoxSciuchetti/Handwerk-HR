import { Progress } from '@/components/ui/progress';

export function TemplateAutomationProgress({
  mocked,
  synchronizing,
  completed = false,
  automating = true,
  finishedCount = 0,
  totalCount = 0,
}: {
  mocked: boolean;
  synchronizing: boolean;
  completed?: boolean;
  automating?: boolean;
  finishedCount?: number;
  totalCount?: number;
}) {
  const finished = Math.min(finishedCount, totalCount);
  const value = completed
    ? 100
    : totalCount > 0
      ? (finished / totalCount) * 100
      : 0;
  const message = completed
    ? 'Durchlauf abgeschlossen'
    : synchronizing
      ? 'Aufgabenstatus wird aktualisiert…'
      : !automating
        ? 'Aufgaben werden erstellt…'
        : totalCount > 0
          ? `${finished} von ${totalCount} Aufgaben bearbeitet`
          : mocked
            ? 'Simulation wird vorbereitet…'
            : 'Automatisierung wird vorbereitet…';
  return (
    <section
      aria-label="Fortschritt der Automatisierung"
      className="pointer-events-none min-w-0 flex-1 space-y-1 pr-1"
    >
      <p
        role="status"
        className="truncate text-[10px] leading-4 text-muted-foreground"
      >
        {message}
      </p>
      <Progress
        aria-label="Automatisierung"
        aria-valuetext={message}
        className="h-1 w-full [&_[data-slot=progress-indicator]]:bg-emerald-500"
        value={value}
      />
    </section>
  );
}
