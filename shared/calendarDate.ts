export function parseCalendarDate(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

export function formatCalendarDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

export function addCalendarYears(date: Date, years: number): Date {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const candidate = new Date(Date.UTC(year, month, day));
  if (candidate.getUTCMonth() !== month) {
    return new Date(Date.UTC(year, month + 1, 0));
  }
  return candidate;
}

export function isCalendarDayBefore(value: string, today: Date): boolean {
  const date = parseCalendarDate(value);
  if (!date) return false;
  const current = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  return date.getTime() < current.getTime();
}

/** Calendar day as `YYYY-MM-DD` in Europe/Berlin. */
export function berlinToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** UTC midnight for a `YYYY-MM-DD` calendar day. */
export function calendarDayUtc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}
