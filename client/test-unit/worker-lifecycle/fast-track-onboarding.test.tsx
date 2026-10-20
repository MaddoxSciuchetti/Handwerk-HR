import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { FastTrackOnboarding } from '@/features/worker-lifecycle/components/lifycycle-modal-content/FastTrackOnboarding';
import { getMicrosoftMailAddresses } from '@/features/worker-task-management/api/engagementMail.api';
import API from '@/config/apiClient';
vi.mock('@/features/worker-task-management/api/engagementMail.api', () => ({
  getMicrosoftMailAddresses: vi.fn(),
}));
vi.mock('@/config/apiClient', () => ({ default: { post: vi.fn() } }));
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getMicrosoftMailAddresses).mockResolvedValue({
    addresses: [
      { email: 'office@example.test', label: 'Office', kind: 'mailbox' },
    ],
    error: null,
  });
});
it('requires an explicit sender and submits it with the employee email', async () => {
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
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText('E-Mail des Mitarbeiters'),
    'ada@example.test'
  );
  expect(screen.getByRole('button', { name: 'Anlegen' })).toBeDisabled();
  const sender = screen.getByRole('combobox', { name: 'Absender' });
  await waitFor(() => expect(sender).not.toBeDisabled());
  fireEvent.keyDown(sender, { key: 'ArrowDown' });
  await user.click(await screen.findByRole('option', { name: 'Office' }));
  await user.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      email: 'ada@example.test',
      senderAddress: 'office@example.test',
    })
  );
  await waitFor(() =>
    expect(onCreated).toHaveBeenCalledWith({ engagementId: 'engagement' })
  );
});

it('uses the staging default without a sender selector', async () => {
  vi.mocked(getMicrosoftMailAddresses).mockResolvedValue({
    addresses: [],
    error: null,
    defaultSenderAddress: 'hello@example.test',
  });
  vi.mocked(API.post).mockResolvedValue({
    data: { worker: { id: 'worker' }, engagement: { id: 'engagement' } },
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <FastTrackOnboarding onCreated={vi.fn()} />
    </QueryClientProvider>
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Anlegen' })).toBeEnabled()
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
      senderAddress: 'hello@example.test',
    })
  );
});
