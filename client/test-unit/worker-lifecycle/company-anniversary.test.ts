import { describe, expect, it } from 'vitest';
import {
  formatCompanyAnniversary,
  formatDaysUntil,
  nextCompanyAnniversary,
  nextUpcomingAnniversary,
} from '@/features/worker-lifecycle/utils/companyAnniversary';

const today = new Date('2026-10-21T12:00:00.000Z');

describe('next company anniversary', () => {
  it('returns the next milestone that is today or still ahead', () => {
    const anniversary = nextCompanyAnniversary('2018-08-01', today);
    expect(anniversary?.years).toBe(10);
    expect(formatCompanyAnniversary(anniversary)).toBe('10 Jahre · 01.08.2028');
  });

  it('keeps a milestone that falls on today', () => {
    const anniversary = nextCompanyAnniversary(
      '2021-10-21',
      new Date('2026-10-21T18:00:00.000Z')
    );
    expect(formatCompanyAnniversary(anniversary)).toBe('5 Jahre · 21.10.2026');
  });

  it('shows the 25-year date after every milestone has passed', () => {
    const anniversary = nextCompanyAnniversary('1990-01-01', today);
    expect(formatCompanyAnniversary(anniversary)).toBe('25 Jahre · 01.01.2015');
  });

  it('has no anniversary without an entry date', () => {
    expect(nextCompanyAnniversary(null, today)).toBeNull();
    expect(formatCompanyAnniversary(null)).toBe('—');
  });
});

describe('next upcoming anniversary', () => {
  it('picks the soonest person and describes the wait', () => {
    const next = nextUpcomingAnniversary(
      [
        {
          id: 'later',
          firstName: 'Nico',
          lastName: 'Lange',
          entryDate: '2025-04-15',
        },
        {
          id: 'sooner',
          firstName: 'Franz',
          lastName: 'Raudszus',
          entryDate: '2022-06-13',
        },
      ],
      today
    );

    expect(next?.people.map((person) => person.id)).toEqual(['sooner']);
    expect(next?.people[0]?.years).toBe(5);
    expect(formatDaysUntil(0)).toBe('Heute');
    expect(formatDaysUntil(1)).toBe('Morgen');
    expect(formatDaysUntil(1280)).toBe('in 1.280 Tagen');
  });

  it('includes everyone who shares that date and skips a finished 25-year mark', () => {
    const next = nextUpcomingAnniversary(
      [
        {
          id: 'past',
          firstName: 'Alt',
          lastName: 'Mitarbeiter',
          entryDate: '1990-01-01',
        },
        {
          id: 'a',
          firstName: 'Ada',
          lastName: 'Eins',
          entryDate: '2021-10-21',
        },
        {
          id: 'b',
          firstName: 'Bea',
          lastName: 'Zwei',
          entryDate: '2016-10-21',
        },
      ],
      today
    );

    expect(next?.people.map((person) => [person.id, person.years])).toEqual([
      ['a', 5],
      ['b', 10],
    ]);
  });
});
