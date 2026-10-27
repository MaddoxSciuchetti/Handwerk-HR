import { expect, it } from 'vitest';
import { workerEngagementInfoItems } from '@/features/worker-lifecycle/consts/worker-engagement-info.consts';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';

it('uses the current type for the Information task count, including a return to Team', () => {
  const onboarding = {
    id: 'entry',
    type: 'onboarding',
    status: 'completed',
    issues: [
      { id: 'a', status: 'done' },
      { id: 'b', status: 'open' },
    ],
  };
  const offboarding = {
    id: 'exit',
    type: 'offboarding',
    status: 'pending',
    issues: [{ id: 'c', status: 'open' }],
  };
  const worker = {
    firstName: 'Ada',
    lastName: 'Test',
    engagements: [offboarding, onboarding],
  } as unknown as WorkerDetailResponse['data'];
  const count = () =>
    workerEngagementInfoItems(worker).find((item) => item.label === 'Aufgaben')
      ?.value;
  expect(count()).toBe('1');
  worker.engagements.unshift({
    ...onboarding,
    id: 'team',
    type: 'transfer',
    issues: [],
  } as unknown as (typeof worker.engagements)[number]);
  expect(count()).toBeUndefined();
});
