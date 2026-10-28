import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { FastTrackOnboarding } from '@/features/worker-lifecycle/components/lifycycle-modal-content/FastTrackOnboarding';
import API, { apiJson } from '@/config/apiClient';

const auth = vi.hoisted(() => ({ user: { email: ' ADA@Example.test ' } }));
vi.mock('@/features/user-profile/hooks/useAuth', () => ({
  default: () => auth,
}));
vi.mock('@/config/apiClient', () => ({
  default: { post: vi.fn() },
  apiJson: { get: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.user = { email: ' ADA@Example.test ' };
  vi.mocked(apiJson.get).mockResolvedValue({
    data: {
      addresses: [
        { email: 'office@example.test', label: 'Office', kind: 'mailbox' },
        { email: 'ada@example.test', label: 'Ada', kind: 'mailbox' },
      ],
      error: null,
    },
  });
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
  return { onCreated, client };
}

it('defaults to the signed-in mailbox once senders load and submits it', async () => {
  const { onCreated } = renderForm();
  await waitFor(() =>
    expect(
      screen.getByRole('combobox', { name: 'Absender' })
    ).toHaveTextContent('Ada')
  );
  await userEvent.type(
    screen.getByLabelText('E-Mail des Mitarbeiters'),
    'worker@example.test'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      email: 'worker@example.test',
      senderAddress: 'ada@example.test',
    })
  );
  await waitFor(() =>
    expect(onCreated).toHaveBeenCalledWith({ engagementId: 'engagement' })
  );
});

it('keeps an explicit sender choice when senders refresh', async () => {
  const { client } = renderForm();
  const select = screen.getByRole('combobox', { name: 'Absender' });
  await waitFor(() => expect(select).toHaveTextContent('Ada'));
  await userEvent.click(select);
  await userEvent.click(screen.getByRole('option', { name: 'Office' }));
  await client.invalidateQueries({ queryKey: ['questionnaire-senders'] });
  expect(select).toHaveTextContent('Office');
  await userEvent.type(
    screen.getByLabelText('E-Mail des Mitarbeiters'),
    'worker@example.test'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Anlegen' }));
  await waitFor(() =>
    expect(API.post).toHaveBeenCalledWith('/worker/fast-track', {
      email: 'worker@example.test',
      senderAddress: 'office@example.test',
    })
  );
});

it('requires a sender choice if the signed-in account has no available mailbox', async () => {
  auth.user = { email: 'missing@example.test' };
  renderForm();
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Absender' })).toBeEnabled()
  );
  expect(screen.getByRole('combobox', { name: 'Absender' })).toHaveTextContent(
    'Absender wählen'
  );
  expect(screen.getByRole('button', { name: 'Anlegen' })).toBeDisabled();
  expect(API.post).not.toHaveBeenCalled();
});
