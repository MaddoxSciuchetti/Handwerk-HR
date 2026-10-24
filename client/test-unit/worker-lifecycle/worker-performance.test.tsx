import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import queryClient from '@/config/query.client';
import API from '@/config/apiClient';
import { employeeQueries } from '@/features/employee-overview/query-options/queries/employee.queries';
import {
  deleteWorkersByIds,
  updateEngagement,
} from '@/features/worker-lifecycle/api';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { useChangeResponsibleUser } from '@/features/worker-lifecycle/hooks/useChangeResponsibleUser';
import type { WorkerRecord } from '@/features/worker-lifecycle/types/index.types';

vi.mock('@/config/apiClient', () => ({ default: { post: vi.fn() } }));
vi.mock('@/features/worker-lifecycle/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/worker-lifecycle/api')>()),
  updateEngagement: vi.fn(),
}));
const workers = [
  {
    id: 'worker',
    engagements: [
      {
        id: 'engagement',
        responsibleUser: {
          id: 'old',
          firstName: 'Old',
          lastName: 'User',
          email: '',
        },
      },
    ],
  },
] as WorkerRecord[];
function setup() {
  queryClient.setQueryData([ALL_WORKER_DATA], workers);
  queryClient.setQueryData(employeeQueries.getEmployees().queryKey, [
    {
      id: 'new',
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.test',
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      organizationMembers: [],
      absences: [],
    },
  ]);
  return renderHook(() => useChangeResponsibleUser(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}
afterEach(() => {
  queryClient.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
describe('worker mutation performance', () => {
  it('deletes the selection in one HTTP request', async () => {
    await deleteWorkersByIds(['worker-1', 'worker-2']);
    expect(API.post).toHaveBeenCalledExactlyOnceWith('worker/bulk-delete', {
      workerIds: ['worker-1', 'worker-2'],
    });
  });
  it('updates the responsible person immediately and does not wait for refetches to finish', async () => {
    let finish!: () => void;
    vi.mocked(updateEngagement).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    vi.spyOn(queryClient, 'invalidateQueries').mockImplementation(
      () => new Promise(() => {})
    );
    const { result } = setup();
    act(() =>
      result.current.mutate({
        workerId: 'worker',
        engagementId: 'engagement',
        userId: 'new',
      })
    );
    await waitFor(() =>
      expect(
        queryClient.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0]
          .engagements[0].responsibleUser.id
      ).toBe('new')
    );
    expect(result.current.isPending).toBe(true);
    await act(async () => finish());
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
  it('restores the previous responsible person when saving fails', async () => {
    vi.mocked(updateEngagement).mockRejectedValue(new Error('failed'));
    const { result } = setup();
    act(() =>
      result.current.mutate({
        workerId: 'worker',
        engagementId: 'engagement',
        userId: 'new',
      })
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData([ALL_WORKER_DATA])).toEqual(workers);
  });
});
