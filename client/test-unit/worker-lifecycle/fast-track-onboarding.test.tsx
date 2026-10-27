import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { FastTrackOnboarding } from '@/features/worker-lifecycle/components/lifycycle-modal-content/FastTrackOnboarding';
import API from '@/config/apiClient';

vi.mock('@/config/apiClient', () => ({ default: { post: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
});

it('creates the employee without a separate sender', async () => {
  const onCreated = vi.fn();
  vi.mocked(API.post).mockResolvedValue({
    data: { worker: { id: 'worker' }, engagement: { id: 'engagement' } },
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <FastTrackOnboarding onCreated={onCreated} />
    </QueryClientProvider>
  );
  expect(
    screen.queryByRole('combobox', { name: 'Absender' })
  ).not.toBeInTheDocument();
  await userEvent.type(
    screen.getByLabelText('E-Mail des Mitarbeiters'),
    'ada@example.test'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      email: 'ada@example.test',
    })
  );
  await waitFor(() =>
    expect(onCreated).toHaveBeenCalledWith({ engagementId: 'engagement' })
  );
});
