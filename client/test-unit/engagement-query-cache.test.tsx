import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { expect, it, vi } from 'vitest';
import { getEngagementClothing } from '@/features/worker-task-management/api/engagementClothing.api';
import {
  engagementClothingKey,
  useEngagementClothing,
} from '@/features/worker-task-management/hooks/useEngagementClothing';

vi.mock('@/features/worker-task-management/api/engagementClothing.api', () => ({
  getEngagementClothing: vi.fn(),
  createEngagementClothing: vi.fn(),
  deleteEngagementClothing: vi.fn(),
  returnEngagementClothing: vi.fn(),
}));

it('reuses recently loaded tab data on remount and still refreshes after invalidation', async () => {
  vi.mocked(getEngagementClothing).mockResolvedValue([]);
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={query}>{children}</QueryClientProvider>
  );
  const first = renderHook(() => useEngagementClothing('worker-1', 'eng-1'), {
    wrapper,
  });
  await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
  expect(getEngagementClothing).toHaveBeenCalledTimes(1);
  first.unmount();
  const second = renderHook(() => useEngagementClothing('worker-1', 'eng-1'), {
    wrapper,
  });
  expect(second.result.current.isSuccess).toBe(true);
  expect(second.result.current.isFetching).toBe(false);
  expect(getEngagementClothing).toHaveBeenCalledTimes(1);
  await act(async () => {
    await query.invalidateQueries({
      queryKey: engagementClothingKey('worker-1', 'eng-1'),
    });
  });
  expect(getEngagementClothing).toHaveBeenCalledTimes(2);
  second.unmount();
  query.clear();
});
