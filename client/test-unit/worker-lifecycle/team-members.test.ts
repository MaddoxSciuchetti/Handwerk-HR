import { ENGAGEMENT_TYPE_OPTIONS } from '@/features/worker-lifecycle/consts/engagement-type.consts';
import {
  compareTeamWorkers,
  isTeamMember,
  showsCompanyAnniversary,
  type TeamWorker,
} from '@/features/worker-lifecycle/utils/teamMembers';
import { describe, expect, it } from 'vitest';

const today = new Date('2026-10-21T12:00:00.000Z');

function worker(
  type: TeamWorker['engagements'][number]['type'],
  status: string,
  extra: Partial<TeamWorker> = {}
): TeamWorker {
  return {
    firstName: 'Ada',
    lastName: 'Example',
    engagements: [{ type, status }],
    ...extra,
  };
}

describe('team membership', () => {
  it('labels the stored transfer type as Team', () => {
    expect(ENGAGEMENT_TYPE_OPTIONS).toContainEqual({
      label: 'Team',
      value: 'transfer',
    });
    expect(ENGAGEMENT_TYPE_OPTIONS.map((option) => option.label)).not.toContain(
      'Transfer'
    );
  });

  it('includes Team workers and completed onboarding', () => {
    expect(isTeamMember(worker('transfer', 'completed'), today)).toBe(true);
    expect(isTeamMember(worker('onboarding', 'completed'), today)).toBe(true);
    expect(showsCompanyAnniversary(worker('transfer', 'in_progress'))).toBe(
      true
    );
  });

  it('excludes in-progress onboarding, offboarding, and people who already left', () => {
    expect(isTeamMember(worker('onboarding', 'in_progress'), today)).toBe(
      false
    );
    expect(isTeamMember(worker('offboarding', 'in_progress'), today)).toBe(
      false
    );
    expect(isTeamMember(worker('offboarding', 'completed'), today)).toBe(false);
    expect(
      isTeamMember(
        worker('transfer', 'completed', { exitDate: '2026-10-20' }),
        today
      )
    ).toBe(false);
    expect(
      isTeamMember(
        worker('transfer', 'completed', { exitDate: '2026-12-01' }),
        today
      )
    ).toBe(true);
  });

  it('sorts by birthday month and day, with missing birthdays last', () => {
    const people = [
      worker('transfer', 'completed', {
        firstName: 'Vulnet',
        lastName: 'Shemsi',
        birthday: '1998-12-13',
      }),
      worker('transfer', 'completed', {
        firstName: 'Annika',
        lastName: 'Bimmel',
        birthday: '2005-01-07',
      }),
      worker('transfer', 'completed', {
        firstName: 'Ohne',
        lastName: 'Datum',
      }),
      worker('transfer', 'completed', {
        firstName: 'Sannaullah',
        lastName: 'Qaderi',
        birthday: '1997-01-01',
      }),
    ];

    expect(people.sort(compareTeamWorkers).map((person) => person.lastName)).toEqual([
      'Qaderi',
      'Bimmel',
      'Shemsi',
      'Datum',
    ]);
  });
});
