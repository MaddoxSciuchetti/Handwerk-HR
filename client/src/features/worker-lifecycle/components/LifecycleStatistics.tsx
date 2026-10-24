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
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const cards = [
    {
      label: 'Offene Handwerker',
      value: data?.openWorkers.value,
      level: data?.openWorkers.level,
    },
    {
      label: 'Offene Aufgaben',
      value: data?.openTasks.value,
      level: data?.openTasks.level,
    },
    {
      label: 'Ø Onboarding',
      value: formatDuration(data?.onboarding.averageMs ?? null),
      level: data?.onboarding.level,
    },
    {
      label: data?.offboarding.isRunning
        ? 'Ø bisherige Offboarding-Dauer'
        : 'Ø Offboarding',
      value: formatDuration(data?.offboarding.averageMs ?? null),
      level: data?.offboarding.level,
    },
    {
      label: data?.taskDuration.isRunning
        ? 'Ø bisherige Aufgabendauer'
        : 'Ø Zeit pro Aufgabe',
      value: formatDuration(data?.taskDuration.averageMs ?? null),
      level: data?.taskDuration.level,
    },
  ];
  return (
    <section
      aria-label="Statistiken"
      aria-busy={isPending}
      className="mt-4 shrink-0"
    >
      <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, level }) => (
          <div
            key={label}
            className="min-w-0 rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground"
          >
            <div className="text-[11px] font-medium leading-tight text-muted-foreground">
              {label}
            </div>
            {isPending ? (
              <Skeleton className="mt-1.5 h-6 w-16 rounded-md" />
            ) : (
              <div
                className={cn(
                  'mt-1 text-xl font-semibold leading-none tracking-tight tabular-nums',
                  tones[isError ? 'neutral' : (level ?? 'neutral')]
                )}
              >
                {isError ? '—' : (value ?? '—')}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
