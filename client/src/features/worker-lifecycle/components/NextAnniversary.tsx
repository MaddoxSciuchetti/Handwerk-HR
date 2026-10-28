import { Skeleton } from '@/components/ui/skeleton';
import { formatCalendarDate } from '../utils/calendarDate';
import {
  calendarDaysUntil,
  formatDaysUntil,
  nextUpcomingAnniversaries,
  type UpcomingAnniversary,
  type UpcomingAnniversaryPerson,
} from '../utils/companyAnniversary';

type NextAnniversaryProps = {
  people: UpcomingAnniversaryPerson[];
  isLoading: boolean;
};

function personName(person: UpcomingAnniversaryPerson) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function AnniversaryCard({
  next,
  rank,
}: {
  next: UpcomingAnniversary;
  rank: number;
}) {
  const names = new Intl.ListFormat('de').format(next.people.map(personName));

  return (
    <article
      aria-label={`${rank}. Jubiläum`}
      className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-border bg-muted/40 px-5 py-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background text-sm font-medium tabular-nums text-muted-foreground"
        >
          {rank}
        </span>
        <p className="text-right text-sm text-muted-foreground">
          {next.people.length === 1 ? `${next.people[0].years} Jahre · ` : ''}
          {formatDaysUntil(calendarDaysUntil(next.date))}
        </p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-medium tracking-tight">{names}</p>
          {next.people.length > 1 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {next.people
                .map(
                  (person) => `${personName(person)} · ${person.years} Jahre`
                )
                .join(', ')}
            </p>
          ) : null}
        </div>
        <p className="text-xl font-medium tabular-nums tracking-tight">
          {formatCalendarDate(next.date)}
        </p>
      </div>
    </article>
  );
}

function NextAnniversary({ people, isLoading }: NextAnniversaryProps) {
  const upcoming = nextUpcomingAnniversaries(people, 3);

  return (
    <section
      aria-label="Nächste Jubiläen"
      aria-busy={isLoading}
      className="mb-4 shrink-0"
    >
      {isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : upcoming.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {upcoming.map((next, index) => (
            <AnniversaryCard
              key={next.date.toISOString()}
              next={next}
              rank={index + 1}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/40 px-6 py-4">
          <p className="text-xl font-medium tracking-tight">
            Kein anstehendes Jubiläum
          </p>
        </div>
      )}
    </section>
  );
}

export default NextAnniversary;
