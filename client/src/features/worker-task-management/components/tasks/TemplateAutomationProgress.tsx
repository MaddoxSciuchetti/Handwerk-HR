import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

export function TemplateAutomationProgress({
  mocked,
  synchronizing,
  completed = false,
  automating = true,
  finishedCount = 0,
  activeCount = 0,
  totalCount = 0,
}: {
  mocked: boolean;
  synchronizing: boolean;
  completed?: boolean;
  automating?: boolean;
  finishedCount?: number;
  activeCount?: number;
  totalCount?: number;
}) {
  const finished = Math.min(finishedCount, totalCount);
  const active = completed ? 0 : Math.min(activeCount, totalCount - finished);
  const baseline = finished + active * 0.5;
  const ceiling = finished + active * 0.9;
  const [visualUnits, setVisualUnits] = useState(baseline);

  useEffect(() => {
    if (!active || synchronizing || completed) return;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (stopped) return;
          // Vary both timing and distance, easing towards a limit below completion.
          const fraction = 0.06 + Math.random() * 0.08;
          setVisualUnits((previous) => {
            const current = Math.max(previous, baseline);
            return Math.max(current, current + (ceiling - current) * fraction);
          });
          schedule();
        },
        1200 + Math.random() * 1600
      );
    };
    schedule();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [baseline, ceiling, active, synchronizing, completed]);

  const units = Math.max(baseline, visualUnits);
  const value = completed
    ? 100
    : totalCount > 0
      ? (units / totalCount) * 100
      : 0;
  const message = completed
    ? 'Durchlauf abgeschlossen'
    : synchronizing
      ? 'Aufgabenstatus wird aktualisiert…'
      : !automating
        ? 'Aufgaben werden erstellt…'
        : totalCount > 0
          ? `${active || finished} von ${totalCount} Aufgaben ${active ? 'in Bearbeitung' : 'bearbeitet'}`
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
