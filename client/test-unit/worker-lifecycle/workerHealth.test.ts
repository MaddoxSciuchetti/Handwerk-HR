import {
  getWorkerHealth,
  getWorkerIssueCount,
} from '@/features/worker-lifecycle/utils/workerHealth.utils';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';
import { describe, expect, it } from 'vitest';

function workerWithStatuses(
  statuses: Array<'open' | 'done' | 'cancelled' | 'not_applicable'>
): WorkerRecord {
  return {
    id: 'worker-1',
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    position: null,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    engagements: [
      {
        id: 'engagement-1',
        type: 'onboarding',
        status: 'in_progress',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        startDate: null,
        endDate: null,
        responsibleUser: {
          id: 'user-1',
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace@example.com',
        },
        issues: statuses.map((status, index) => ({
          id: `issue-${index}`,
          status,
        })),
      },
    ],
  };
}

describe('getWorkerHealth', () => {
  it('excludes non-applicable tasks from the count and completion denominator', () => {
    const worker = workerWithStatuses(['done', 'open', 'not_applicable']);
    expect(getWorkerIssueCount(worker)).toBe(2);
    expect(getWorkerHealth(worker)).toMatchObject({
      doneCount: 1,
      totalCount: 2,
      percentage: 50,
    });
  });

  it('shows no percentage when all tasks are non-applicable', () => {
    const worker = workerWithStatuses(['not_applicable']);
    expect(getWorkerIssueCount(worker)).toBe(0);
    expect(getWorkerHealth(worker)).toMatchObject({
      doneCount: 0,
      totalCount: 0,
      percentage: null,
      level: 'neutral',
    });
  });

  it('counts a task again after its status changes back to open', () => {
    const worker = workerWithStatuses(['done', 'not_applicable']);
    expect(getWorkerHealth(worker).percentage).toBe(100);
    worker.engagements[0].issues![1].status = 'open';
    expect(getWorkerIssueCount(worker)).toBe(2);
    expect(getWorkerHealth(worker).percentage).toBe(50);
  });

  it('leaves cancelled tasks out of the completion percentage', () => {
    const health = getWorkerHealth(
      workerWithStatuses(['done', 'done', 'cancelled'])
    );

    expect(health).toMatchObject({
      doneCount: 2,
      totalCount: 2,
      percentage: 100,
      level: 'green',
    });
  });

  it('keeps open tasks in the total after a cancellation', () => {
    const health = getWorkerHealth(
      workerWithStatuses(['done', 'open', 'cancelled'])
    );

    expect(health).toMatchObject({
      doneCount: 1,
      totalCount: 2,
      percentage: 50,
      level: 'orange',
    });
  });
});
