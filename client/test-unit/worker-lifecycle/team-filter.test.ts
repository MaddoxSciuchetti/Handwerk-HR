import { expect, it } from 'vitest';
import { applyFilter } from '@/features/worker-lifecycle/utils/applyFilter';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

it('matches the current type rather than historical Team records', () => {
  const workers = [
    {
      id: 'leaving',
      engagements: [{ type: 'offboarding' }, { type: 'transfer' }],
    },
    {
      id: 'team',
      engagements: [{ type: 'transfer' }, { type: 'offboarding' }],
    },
  ] as WorkerRecord[];
  expect(applyFilter(workers, ['transfer']).map((worker) => worker.id)).toEqual(
    ['team']
  );
  expect(
    applyFilter(workers, ['offboarding']).map((worker) => worker.id)
  ).toEqual(['leaving']);
  expect(
    applyFilter(workers, ['transfer', 'offboarding']).map((worker) => worker.id)
  ).toEqual(['leaving', 'team']);
  expect(applyFilter(workers, [])).toEqual([]);
});
