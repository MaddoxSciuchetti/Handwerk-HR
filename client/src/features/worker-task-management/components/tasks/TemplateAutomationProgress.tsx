import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function TemplateAutomationProgress({
  mocked,
  synchronizing,
  completed = false,
  automating = true,
  progress,
}: {
  mocked: boolean;
  synchronizing: boolean;
  completed?: boolean;
  automating?: boolean;
  progress?: number;
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (completed) return;
    const startedAt = Date.now();
    const timer = window.setInterval(
      () => setElapsed((Date.now() - startedAt) / 1000),
      250
    );
    return () => window.clearInterval(timer);
  }, [completed]);
  const message = completed
    ? 'Durchlauf abgeschlossen'
    : synchronizing
      ? 'Aufgabenstatus wird aktualisiert…'
      : !automating
        ? 'Aufgaben werden erstellt…'
        : mocked
          ? elapsed < 3
            ? 'Automatisierung wird vorbereitet…'
            : elapsed < 7
              ? 'Anfrage an die Integration wird simuliert…'
              : 'Warte auf simulierte Erfolgsbestätigung…'
          : 'Automatisierung läuft…';
  return (
    <section
      aria-label="Fortschritt der Automatisierung"
      className="pointer-events-none min-w-0 flex-1 space-y-1 pr-1"
    >
      {!completed && (
        <p
          role="status"
          className="truncate text-[10px] leading-4 text-muted-foreground"
        >
          {message}
        </p>
      )}
      <Progress
        aria-label="Automatisierung"
        className={cn(
          'h-1 w-full [&_[data-slot=progress-indicator]]:duration-300 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none',
          '[&_[data-slot=progress-indicator]]:bg-emerald-500'
        )}
        value={
          completed
            ? 100
            : synchronizing
              ? 99
              : progress !== undefined
                ? progress
                : mocked
                  ? Math.min(elapsed * 10, 95)
                  : undefined
        }
      />
    </section>
  );
}
