import {
  addCalendarYears,
  formatCalendarDate,
  parseCalendarDate,
} from './calendarDate';

export const MILESTONE_YEARS = [5, 10, 15, 20, 25] as const;

export type CompanyAnniversary = {
  years: (typeof MILESTONE_YEARS)[number];
  date: Date;
};

function startOfUtcDay(today: Date) {
  return new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
}

export function nextCompanyAnniversary(
  entryDate: string | null | undefined,
  today = new Date()
): CompanyAnniversary | null {
  if (!entryDate) return null;
  const entry = parseCalendarDate(entryDate);
  if (!entry) return null;

  const current = startOfUtcDay(today);

  let latest: CompanyAnniversary | null = null;
  for (const years of MILESTONE_YEARS) {
    const date = addCalendarYears(entry, years);
    latest = { years, date };
    if (date.getTime() >= current.getTime()) return latest;
  }

  return latest;
}

/** Milestone that falls exactly on `today`'s UTC calendar day, if any. */
export function dueCompanyAnniversary(
  entryDate: string | null | undefined,
  today = new Date()
): CompanyAnniversary | null {
  const next = nextCompanyAnniversary(entryDate, today);
  if (!next) return null;
  const current = startOfUtcDay(today).getTime();
  return next.date.getTime() === current ? next : null;
}

export function formatCompanyAnniversary(
  anniversary: CompanyAnniversary | null
): string {
  if (!anniversary) return '—';
  return `${anniversary.years} Jahre · ${formatCalendarDate(anniversary.date)}`;
}

export type UpcomingAnniversaryPerson = {
  id: string;
  firstName: string;
  lastName: string;
  entryDate?: string | null;
};

export type UpcomingAnniversary = {
  people: Array<
    UpcomingAnniversaryPerson & { years: CompanyAnniversary['years'] }
  >;
  date: Date;
};

export function calendarDaysUntil(date: Date, today = new Date()) {
  const day = 86_400_000;
  return Math.round((date.getTime() - startOfUtcDay(today).getTime()) / day);
}

export function nextUpcomingAnniversaries(
  people: UpcomingAnniversaryPerson[],
  limit = 3,
  today = new Date()
): UpcomingAnniversary[] {
  if (limit <= 0) return [];

  const current = startOfUtcDay(today).getTime();
  const byDate = new Map<number, UpcomingAnniversary>();

  for (const person of people) {
    const anniversary = nextCompanyAnniversary(person.entryDate, today);
    if (!anniversary || anniversary.date.getTime() < current) continue;

    const key = anniversary.date.getTime();
    const existing = byDate.get(key);
    if (existing) {
      existing.people.push({ ...person, years: anniversary.years });
      continue;
    }
    byDate.set(key, {
      people: [{ ...person, years: anniversary.years }],
      date: anniversary.date,
    });
  }

  return [...byDate.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

export function nextUpcomingAnniversary(
  people: UpcomingAnniversaryPerson[],
  today = new Date()
): UpcomingAnniversary | null {
  return nextUpcomingAnniversaries(people, 1, today)[0] ?? null;
}

export function formatDaysUntil(days: number) {
  if (days <= 0) return 'Heute';
  if (days === 1) return 'Morgen';
  return `in ${new Intl.NumberFormat('de-DE').format(days)} Tagen`;
}
