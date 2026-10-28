import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getWorkerById } from '@/features/worker-task-management/api/index.api';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import useTaskData from '@/features/worker-task-management/hooks/useTaskData';
import type {
  WorkerDetailResponse,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import { workerLifecycleQueries } from '@/features/worker-lifecycle/query-options/queries/worker-lifycycle.queries';
import { getWorkerData } from '@/features/worker-lifecycle/api';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import { PERSONNEL_DOCUMENTS } from '@/features/worker-task-management/consts/query-key.consts';
import { workerRefreshInterval } from '@/features/worker-lifecycle/utils/workerRefreshInterval';

vi.mock('@/features/worker-task-management/api/index.api', () => ({
  getWorkerById: vi.fn(),
}));
vi.mock('@/features/worker-lifecycle/api', () => ({ getWorkerData: vi.fn() }));

const worker = (taskIds: string[]) =>
  ({
    success: true,
    data: {
      id: 'worker-1',
      engagements: [
        {
          id: 'engagement-1',
          issues: taskIds.map((id) => ({ id, title: id })),
        },
      ],
    },
  }) as WorkerDetailResponse;

let client: QueryClient;
function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.resetAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(() => {
  client.clear();
  vi.useRealTimers();
});

it('loads newly created tasks when returning to Aufgaben while the worker remains mounted', async () => {
  vi.mocked(getWorkerById).mockResolvedValue(worker(['task-1']));
  const { result, rerender } = renderHook(
    ({ visible }) => useTaskData('worker-1', visible),
    { initialProps: { visible: true }, wrapper: Wrapper }
  );
  await waitFor(() => expect(result.current.data).toEqual(worker(['task-1'])));

  rerender({ visible: false });
  vi.mocked(getWorkerById).mockResolvedValue(worker(['task-1', 'task-2']));
  expect(getWorkerById).toHaveBeenCalledTimes(1);
  rerender({ visible: true });

  await waitFor(() =>
    expect(result.current.data).toEqual(worker(['task-1', 'task-2']))
  );
  expect(getWorkerById).toHaveBeenCalledTimes(2);
  rerender({ visible: true });
  expect(getWorkerById).toHaveBeenCalledTimes(2);
});

it('refreshes on reopening a worker even when its cached tasks are still fresh', async () => {
  client.setQueryData([WORKERBYID, 'worker-1'], worker(['task-1']));
  vi.mocked(getWorkerById).mockResolvedValue(worker(['task-1', 'task-2']));
  const { result } = renderHook(() => useTaskData('worker-1'), {
    wrapper: Wrapper,
  });

  await waitFor(() =>
    expect(result.current.data).toEqual(worker(['task-1', 'task-2']))
  );
  expect(getWorkerById).toHaveBeenCalledExactlyOnceWith('worker-1');
});

it('detects an externally completed questionnaire, refreshes dependent caches and stops polling', async () => {
  vi.useFakeTimers();
  const pending = worker(['questionnaire-task']);
  pending.data.engagements[0].questionnaireSubmission = {
    id: 'submission-1',
    status: 'sent',
  };
  const completed = structuredClone(pending);
  completed.data.engagements[0].questionnaireSubmission!.status = 'completed';
  const relatedKeys = [
    ['employment-contract', 'worker-1', 'engagement-1'],
    ['completed-questionnaire', 'worker-1', 'engagement-1'],
    ['questionnaire-draft', 'engagement-1'],
    [PERSONNEL_DOCUMENTS, 'worker-1'],
    [FETCHDESCRIPTION],
    [ALL_WORKER_DATA],
  ];
  for (const key of relatedKeys) client.setQueryData(key, {});
  const unrelatedKey = ['employment-contract', 'worker-2', 'engagement-2'];
  client.setQueryData(unrelatedKey, {});
  vi.mocked(getWorkerById)
    .mockResolvedValueOnce(pending)
    .mockResolvedValue(completed);
  const { result } = renderHook(() => useTaskData('worker-1'), {
    wrapper: Wrapper,
  });
  await vi.waitFor(() => expect(result.current.data).toEqual(pending));
  expect(getWorkerById).toHaveBeenCalledTimes(1);
  for (const key of relatedKeys)
    expect(client.getQueryState(key)?.isInvalidated).toBe(false);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  await vi.waitFor(() => expect(result.current.data).toEqual(completed));
  expect(getWorkerById).toHaveBeenCalledTimes(2);
  for (const key of relatedKeys)
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
  expect(client.getQueryData([ALL_WORKER_DATA, 'detail', 'worker-1'])).toEqual(
    completed
  );
  expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(getWorkerById).toHaveBeenCalledTimes(2);
});

it('keeps fast template polling and only polls questionnaires while a reply is pending', () => {
  expect(workerRefreshInterval()).toBe(false);
  expect(workerRefreshInterval([{ questionnaireSubmission: null }])).toBe(
    false
  );
  expect(
    workerRefreshInterval([
      { questionnaireSubmission: { id: 'q', status: 'sent' } },
    ])
  ).toBe(5000);
  expect(
    workerRefreshInterval([
      { questionnaireSubmission: { id: 'q', status: 'completed' } },
    ])
  ).toBe(false);
  expect(
    workerRefreshInterval([
      {
        templateApplication: { id: 't', completedAt: null },
        questionnaireSubmission: { id: 'q', status: 'sent' },
      },
    ])
  ).toBe(2000);
});

it('refreshes the worker list while a questionnaire is pending and stops after completion', async () => {
  vi.useFakeTimers();
  const pending = worker(['questionnaire-task']);
  pending.data.engagements[0].questionnaireSubmission = {
    id: 'submission-1',
    status: 'sent',
  };
  const completed = structuredClone(pending);
  completed.data.engagements[0].questionnaireSubmission!.status = 'completed';
  const pendingList = [pending.data] as WorkerRecord[];
  const completedList = [completed.data] as WorkerRecord[];
  vi.mocked(getWorkerData)
    .mockResolvedValueOnce(pendingList)
    .mockResolvedValue(completedList);
  const { result } = renderHook(
    () => useQuery(workerLifecycleQueries.workerData()),
    { wrapper: Wrapper }
  );
  await vi.waitFor(() => expect(result.current.data).toEqual(pendingList));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  await vi.waitFor(() => expect(result.current.data).toEqual(completedList));
  expect(getWorkerData).toHaveBeenCalledTimes(2);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(getWorkerData).toHaveBeenCalledTimes(2);
});
