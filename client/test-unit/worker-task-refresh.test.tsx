import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getWorkerById } from '@/features/worker-task-management/api/index.api';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';
import useTaskData from '@/features/worker-task-management/hooks/useTaskData';
import type { WorkerDetailResponse } from '@/features/worker-lifecycle/types/index.types';

vi.mock('@/features/worker-task-management/api/index.api', () => ({
  getWorkerById: vi.fn(),
}));

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
afterEach(() => client.clear());

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
