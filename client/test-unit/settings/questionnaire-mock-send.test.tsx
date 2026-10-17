import { QuestionnaireSendDialog } from '@/features/questionnaire/QuestionnaireSendDialog';
import { apiJson } from '@/config/apiClient';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn(), post: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const draft = {
  success: true,
  data: {
    engagementId: 'engagement',
    email: 'lukas@example.test',
    sent: false,
    mockEnabled: true,
    questions: [
      { key: 'firstName', label: 'Vorname', section: 'Person', type: 'text' },
    ],
    repeaters: [],
  },
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiJson.get).mockResolvedValue(draft);
  vi.mocked(apiJson.put).mockResolvedValue(draft);
});

it('labels mock mode and continues after simulated answers without reporting a failed email', async () => {
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { emailSent: false, mockCompleted: true },
  });
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Es wird keine E-Mail verschickt'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Senden' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.post).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire/send'
  );
  expect(toast.success).toHaveBeenCalledWith(
    'Testfragebogen ausgefüllt. Der Vertrag kann bearbeitet werden.'
  );
  expect(toast.error).not.toHaveBeenCalled();
});

it('still reports real email delivery failures when mock mode is off', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    ...draft,
    data: { ...draft.data, mockEnabled: false },
  });
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { emailSent: false, mockCompleted: false },
  });
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  await userEvent.click(await screen.findByRole('button', { name: 'Senden' }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith(
      'Die E-Mail ist nicht rausgegangen. Senden erneut versuchen.'
    )
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('can retry a pending mock after reopening the send dialog', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    ...draft,
    data: { ...draft.data, sent: true, status: 'sent' },
  });
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { emailSent: false, mockCompleted: true },
  });
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  const send = await screen.findByRole('button', { name: 'Senden' });
  await waitFor(() => expect(send).toBeEnabled());
  await userEvent.click(send);
  await waitFor(() => expect(onClose).toHaveBeenCalled());
});
