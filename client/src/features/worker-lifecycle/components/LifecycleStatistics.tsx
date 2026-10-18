import { useQuery } from '@tanstack/react-query';
import API from '@/config/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ALL_WORKER_DATA } from '../consts/query-key.consts';

type Level = 'green' | 'orange' | 'neutral';
type Count = { value: number; overdue: number; level: Level };
type Duration = {
  averageMs: number | null;
  count: number;
  level: Level;
  isRunning?: boolean;
};
type Statistics = {
  openWorkers: Count;
  openTasks: Count;
  onboarding: Duration;
  offboarding: Duration;
  taskDuration: Duration;
};

function formatDuration(ms: number | null) {
  if (ms === null) return '—';
  const minutes = ms / 60_000;
  const number = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  if (minutes < 1) return '< 1 Min.';
  if (minutes < 60) return `${number.format(minutes)} Min.`;
  if (minutes < 1440) return `${number.format(minutes / 60)} Std.`;
  return `${number.format(minutes / 1440)} Tage`;
}
const tones: Record<Level, string> = {
  green: 'text-emerald-700 dark:text-emerald-400',
  orange: 'text-orange-700 dark:text-orange-400',
  neutral: 'text-card-foreground',
};
export function LifecycleStatistics() {
  const { data, isPending, isError } = useQuery({
    queryKey: [ALL_WORKER_DATA, 'statistics'],
    queryFn: async () => {
      const response = await API.get<
        { success: boolean; data: Statistics },
        { success: boolean; data: Statistics }
      >('/worker/statistics');
      return response.data;
    },
    refetchInterval: 60_000,
  });
  const countDetail = (count?: Count) =>
    count
      ? count.overdue
        ? `${count.overdue} überfällig`
        : count.value === 0
          ? 'Alles erledigt'
          : ''
      : '—';
  const durationDetail = (duration?: Duration) =>
    duration?.isRunning
      ? ''
      : duration?.count
        ? `${duration.count} abgeschlossen · ${duration.level === 'orange' ? 'Frist überschritten' : duration.level === 'green' ? 'Fristen eingehalten' : 'Ohne Fristbewertung'}`
        : '';
  const cards = [
    {
      label: 'Offene Handwerker',
      value: data?.openWorkers.value,
      detail: countDetail(data?.openWorkers),
      level: data?.openWorkers.level,
    },
    {
      label: 'Offene Aufgaben',
      value: data?.openTasks.value,
      detail: countDetail(data?.openTasks),
      level: data?.openTasks.level,
    },
    {
      label: 'Ø Onboarding',
      value: formatDuration(data?.onboarding.averageMs ?? null),
      detail: durationDetail(data?.onboarding),
      level: data?.onboarding.level,
    },
    {
      label: data?.offboarding.isRunning
        ? 'Ø bisherige Offboarding-Dauer'
        : 'Ø Offboarding',
      value: formatDuration(data?.offboarding.averageMs ?? null),
      detail: durationDetail(data?.offboarding),
      level: data?.offboarding.level,
    },
    {
      label: data?.taskDuration.isRunning
        ? 'Ø bisherige Aufgabendauer'
        : 'Ø Zeit pro Aufgabe',
      value: formatDuration(data?.taskDuration.averageMs ?? null),
      detail: durationDetail(data?.taskDuration),
      level: data?.taskDuration.level,
    },
  ];
  return (
    <section
      aria-label="Statistiken"
      aria-busy={isPending}
      className="mt-5 shrink-0"
    >
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, detail, level }) => (
          <div
            key={label}
            className="min-w-0 rounded-xl border border-border bg-card p-4 text-card-foreground"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
              <span>{label}</span>
            </div>
            {isPending ? (
              <Skeleton className="my-3 h-8 w-20 rounded-lg" />
            ) : (
              <div
                className={cn(
                  'mt-3 text-3xl font-semibold tracking-tight tabular-nums',
                  tones[isError ? 'neutral' : (level ?? 'neutral')]
                )}
              >
                {isError ? '—' : (value ?? '—')}
              </div>
            )}
            {!isError && !isPending && detail && (
              <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
