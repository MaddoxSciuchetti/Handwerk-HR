import { Skeleton } from '@/components/ui/skeleton';
import { formatCalendarDate } from '../utils/calendarDate';
import {
  calendarDaysUntil,
  formatDaysUntil,
  nextUpcomingAnniversary,
  type UpcomingAnniversaryPerson,
} from '../utils/companyAnniversary';

type NextAnniversaryProps = {
  people: UpcomingAnniversaryPerson[];
  isLoading: boolean;
};

function personName(person: UpcomingAnniversaryPerson) {
  return `${person.firstName} ${person.lastName}`.trim();
}

function NextAnniversary({ people, isLoading }: NextAnniversaryProps) {
  const next = nextUpcomingAnniversary(people);
  const names = next
    ? new Intl.ListFormat('de').format(next.people.map(personName))
    : '';

  return (
    <section
      aria-label="Nächstes Jubiläum"
      aria-busy={isLoading}
      className="mb-4 shrink-0 rounded-2xl border border-border bg-muted/40 px-6 py-4"
    >
      <p className="text-sm text-muted-foreground">Nächstes Jubiläum</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-8 w-56" />
      ) : next ? (
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xl font-medium tracking-tight">{names}</p>
            {next.people.length > 1 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {next.people
                  .map((person) => `${personName(person)} · ${person.years} Jahre`)
                  .join(', ')}
              </p>
            ) : null}
          </div>
          <p className="text-right">
            <span className="block text-xl font-medium tabular-nums tracking-tight">
              {formatCalendarDate(next.date)}
            </span>
            <span className="text-sm text-muted-foreground">
              {next.people.length === 1 ? `${next.people[0].years} Jahre · ` : ''}
              {formatDaysUntil(calendarDaysUntil(next.date))}
            </span>
          </p>
        </div>
      ) : (
        <p className="mt-1 text-xl font-medium tracking-tight">
          Kein anstehendes Jubiläum
        </p>
      )}
    </section>
  );
}

export default NextAnniversary;
