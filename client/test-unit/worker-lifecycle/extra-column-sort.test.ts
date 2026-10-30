import { describe, expect, it } from 'vitest';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';
import {
  nextExtraColumnSort,
  sortWorkersByExtraColumn,
} from '@/features/worker-lifecycle/utils/extraColumnSort';

function worker(
  firstName: string,
  fields: Partial<WorkerRecord> = {}
): WorkerRecord {
  return {
    id: firstName,
    firstName,
    lastName: 'Example',
    email: null,
    position: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    engagements: [],
    ...fields,
  };
}

describe('extra column sort', () => {
  it('toggles direction on the same column and starts ascending on a new one', () => {
    expect(nextExtraColumnSort(null, 'birthday')).toEqual({
      column: 'birthday',
      direction: 'asc',
    });
    expect(
      nextExtraColumnSort({ column: 'birthday', direction: 'asc' }, 'birthday')
    ).toEqual({ column: 'birthday', direction: 'desc' });
    expect(
      nextExtraColumnSort({ column: 'birthday', direction: 'desc' }, 'anniversary')
    ).toEqual({ column: 'anniversary', direction: 'asc' });
  });

  it('sorts birthdays by month and day with missing values last', () => {
    const workers = [
      worker('Alex', { birthday: '1998-12-13' }),
      worker('Ben', { birthday: '2005-01-07' }),
      worker('Chris', { birthday: null }),
    ];
    expect(
      sortWorkersByExtraColumn(workers, {
        column: 'birthday',
        direction: 'asc',
      }).map((entry) => entry.firstName)
    ).toEqual(['Ben', 'Alex', 'Chris']);
    expect(
      sortWorkersByExtraColumn(workers, {
        column: 'birthday',
        direction: 'desc',
      }).map((entry) => entry.firstName)
    ).toEqual(['Alex', 'Ben', 'Chris']);
  });
});
