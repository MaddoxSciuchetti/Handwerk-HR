import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import API from '@/config/apiClient';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { useSwitchEngagementType } from '@/features/worker-lifecycle/hooks/useSwitchEngagementType';
import type {
  WorkerDetailResponse,
  WorkerRecord,
} from '@/features/worker-lifecycle/types/index.types';
import { WORKERBYID } from '@/features/worker-task-management/consts/query-key.consts';

const onboarding = {
  id: 'onboarding-1',
  type: 'onboarding',
  status: 'completed',
  responsibleUser: { id: 'user-1', firstName: 'Ada', lastName: '', email: '' },
  issues: [{ id: 'task-1', status: 'done' }],
  templateApplication: { id: 'receipt-1', completedAt: '2026-10-01' },
  employmentContract: { id: 'contract-1' },
};
const offboarding = {
  id: 'offboarding-1',
  type: 'offboarding',
  status: 'pending',
};
const detailKeys = [
  [WORKERBYID, 'worker-1'],
  [ALL_WORKER_DATA, 'detail', 'worker-1'],
];

function setup() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  client.setQueryData(
    [ALL_WORKER_DATA],
    [{ id: 'worker-1', engagements: [onboarding] }]
  );
  for (const key of detailKeys) {
    client.setQueryData(key, {
      success: true,
      data: { id: 'worker-1', engagements: [onboarding] },
    });
  }
  // Keep background refresh unresolved: UI propagation must not depend on it.
  vi.spyOn(client, 'invalidateQueries').mockImplementation(
    () => new Promise(() => {})
  );
  const hook = renderHook(() => useSwitchEngagementType(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  });
  return { client, ...hook };
}

describe('phase change propagation', () => {
  it('publishes the saved offboarding to both detail caches before background refresh finishes', async () => {
    let finish!: () => void;
    const put = vi.spyOn(API, 'put').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ success: true, data: offboarding });
        })
    );
    const { client, result, unmount } = setup();
    act(() =>
      result.current.mutate({
        items: [{ workerId: 'worker-1', engagementId: 'onboarding-1' }],
        type: 'offboarding',
      })
    );
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(
      client.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0].engagements[0]
        .type
    ).toBe('offboarding');
    await act(async () => finish());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    for (const key of detailKeys) {
      const phases =
        client.getQueryData<WorkerDetailResponse>(key)!.data.engagements;
      expect(phases[0]).toMatchObject({
        ...offboarding,
        issues: [],
        templateApplication: null,
        employmentContract: null,
      });
      expect(phases[1]).toEqual(onboarding);
    }
    expect(
      client
        .getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0]
        .engagements.map((e) => e.id)
    ).toEqual(['offboarding-1', 'onboarding-1']);
    unmount();
    client.clear();
    put.mockRestore();
  });

  it('keeps onboarding history when switching to Team instead of relabelling it', async () => {
    const team = {
      id: 'team-1',
      type: 'transfer',
      status: 'completed',
    };
    let finish!: () => void;
    const put = vi.spyOn(API, 'put').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ success: true, data: team });
        })
    );
    const { client, result, unmount } = setup();
    act(() =>
      result.current.mutate({
        items: [{ workerId: 'worker-1', engagementId: 'onboarding-1' }],
        type: 'transfer',
      })
    );
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(
      client
        .getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0]
        .engagements.map((engagement) => ({
          id: engagement.id,
          type: engagement.type,
          issues: engagement.issues,
        }))
    ).toEqual([
      {
        id: 'pending:onboarding-1:transfer',
        type: 'transfer',
        issues: [],
      },
      {
        id: 'onboarding-1',
        type: 'onboarding',
        issues: onboarding.issues,
      },
    ]);
    await act(async () => finish());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    for (const key of detailKeys) {
      const phases =
        client.getQueryData<WorkerDetailResponse>(key)!.data.engagements;
      expect(phases[0]).toMatchObject({
        ...team,
        issues: [],
        templateApplication: null,
        employmentContract: null,
      });
      expect(phases[1]).toEqual(onboarding);
    }
    unmount();
    client.clear();
    put.mockRestore();
  });

  it('restores the list and leaves details intact when the save fails', async () => {
    const put = vi.spyOn(API, 'put').mockRejectedValue(new Error('failed'));
    const { client, result, unmount } = setup();
    act(() =>
      result.current.mutate({
        items: [{ workerId: 'worker-1', engagementId: 'onboarding-1' }],
        type: 'offboarding',
      })
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(
      client.getQueryData<WorkerRecord[]>([ALL_WORKER_DATA])?.[0].engagements
    ).toEqual([onboarding]);
    for (const key of detailKeys) {
      expect(
        client.getQueryData<WorkerDetailResponse>(key)?.data.engagements
      ).toEqual([onboarding]);
    }
    unmount();
    client.clear();
    put.mockRestore();
  });
});
