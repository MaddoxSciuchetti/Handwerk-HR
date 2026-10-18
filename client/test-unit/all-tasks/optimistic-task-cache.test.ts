import queryClient from '@/config/query.client';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import {
  patchTaskInCaches,
  removeTasksFromCaches,
  restoreTaskCaches,
  snapshotTaskCaches,
} from '@/features/all-tasks/query-options/mutations/optimisticTaskCache';
import type { IssueResponse } from '@/features/all-tasks/types/index.types';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import type {
  WorkerDetailResponse,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import { beforeEach, describe, expect, it } from 'vitest';

function makeTask(id: string, title = id): IssueResponse {
  return {
    id,
    workerEngagementId: 'engagement-1',
    createdByUserId: 'user-1',
    assigneeUserId: 'user-1',
    templateItemId: null,
    status: 'open',
    kind: 'standard',
    isTemporary: false,
    title,
    description: null,
    priority: 'medium',
    dueDate: null,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function makeWorker(): WorkerRecord {
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
          firstName: 'Ada',
          lastName: 'Lovelace',
          email: 'ada@example.com',
        },
        issues: [{ id: 'task-1', status: 'open' }],
      },
    ],
  };
}

function makeDetail(): WorkerDetailResponse {
  const worker = makeWorker();
  return {
    success: true,
    data: {
      ...worker,
      workEmail: null,
      birthday: null,
      street: null,
      city: null,
      state: null,
      postalCode: null,
      country: null,
      entryDate: null,
      exitDate: null,
      engagements: [
        {
          ...worker.engagements[0],
          issues: [makeTask('task-1', 'Vertrag senden')],
          employmentContract: null,
          arbeitszeugnis: null,
        },
      ],
    },
  };
}

describe('optimistic task cache', () => {
  beforeEach(() => {
    queryClient.clear();
    queryClient.setQueryData([FETCHDESCRIPTION], [
      makeTask('task-1', 'Vertrag senden'),
      makeTask('task-2', 'Helm ausgeben'),
    ]);
    queryClient.setQueryData([ALL_WORKER_DATA], [makeWorker()]);
    queryClient.setQueryData([WORKERBYID, 'worker-1'], makeDetail());
  });

  it('updates the task list and worker progress before the server responds', () => {
    patchTaskInCaches('task-1', { title: 'Vertrag gesendet', status: 'done' });

    const tasks = queryClient.getQueryData<IssueResponse[]>([FETCHDESCRIPTION]);
    expect(tasks?.find((task) => task.id === 'task-1')).toMatchObject({
      title: 'Vertrag gesendet',
      status: 'done',
    });
    expect(tasks?.find((task) => task.id === 'task-2')?.title).toBe(
      'Helm ausgeben'
    );

    const workers = queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA]);
    expect(workers?.[0].engagements[0].issues).toEqual([
      { id: 'task-1', status: 'done' },
    ]);

    const detail = queryClient.getQueryData<WorkerDetailResponse>([
      WORKERBYID,
      'worker-1',
    ]);
    expect(detail?.data.engagements[0].issues?.[0]).toMatchObject({
      title: 'Vertrag gesendet',
      status: 'done',
    });
  });

  it('removes deleted tasks immediately and restores them when the request fails', async () => {
    const snapshot = await snapshotTaskCaches();
    removeTasksFromCaches(['task-1']);

    expect(
      queryClient
        .getQueryData<IssueResponse[]>([FETCHDESCRIPTION])
        ?.map((task) => task.id)
    ).toEqual(['task-2']);
    expect(
      queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0]
        .engagements[0].issues
    ).toEqual([]);

    restoreTaskCaches(snapshot);

    expect(
      queryClient
        .getQueryData<IssueResponse[]>([FETCHDESCRIPTION])
        ?.map((task) => task.id)
    ).toEqual(['task-1', 'task-2']);
    expect(
      queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0]
        .engagements[0].issues
    ).toEqual([{ id: 'task-1', status: 'open' }]);
  });
});
