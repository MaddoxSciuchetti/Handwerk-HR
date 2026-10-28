import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { FastTrackOnboarding } from '@/features/worker-lifecycle/components/lifycycle-modal-content/FastTrackOnboarding';
import API from '@/config/apiClient';

vi.mock('@/config/apiClient', () => ({ default: { post: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(API.post).mockResolvedValue({
    data: { worker: { id: 'worker' }, engagement: { id: 'engagement' } },
  });
});

function renderForm() {
  const onCreated = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <FastTrackOnboarding onCreated={onCreated} />
    </QueryClientProvider>
  );
  return { onCreated };
}

it('creates onboarding without asking for or posting a sender address', async () => {
  const { onCreated } = renderForm();
  expect(
    screen.queryByRole('combobox', { name: 'Absender' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Anlegen' })).toBeEnabled();
  await userEvent.type(
    screen.getByLabelText('Name oder E-Mail des Mitarbeiters'),
    'worker@example.test'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      email: 'worker@example.test',
    })
  );
  await waitFor(() =>
    expect(onCreated).toHaveBeenCalledWith({ engagementId: 'engagement' })
  );
});

it('creates onboarding by name without an email', async () => {
  const { onCreated } = renderForm();
  await userEvent.type(
    screen.getByLabelText('Name oder E-Mail des Mitarbeiters'),
    'Max Mustermann'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      name: 'Max Mustermann',
    })
  );
  await waitFor(() =>
    expect(onCreated).toHaveBeenCalledWith({ engagementId: 'engagement' })
  );
});

it('does not create onboarding with an empty recipient email', async () => {
  renderForm();
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  expect(API.post).not.toHaveBeenCalled();
});
