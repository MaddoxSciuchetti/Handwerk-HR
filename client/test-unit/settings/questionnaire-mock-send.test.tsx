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

it('opens the real preview and edits questions only through the engagement editor', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  await screen.findByRole('heading', { name: 'Personalfragebogen' });
  expect(screen.queryByText('Neue Frage')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Absenden' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Frage hier einfügen' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
  expect(screen.getByRole('textbox', { name: 'Frage' })).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Antwort' }), 'Lukas');
  await user.click(screen.getByRole('button', { name: 'Frage hier einfügen' }));
  await user.type(screen.getByPlaceholderText('Frage'), 'Zusatzfrage');
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  await user.click(screen.getByRole('button', { name: 'Fertig' }));
  expect(screen.getByLabelText(/^Vorname/)).toHaveValue('Lukas');
  expect(screen.getByLabelText(/^Vorname/)).toBeDisabled();
  expect(screen.getByLabelText(/^Zusatzfrage/)).toBeInTheDocument();
  expect(screen.queryByText('Neue Frage')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire',
    expect.objectContaining({
      definition: expect.objectContaining({
        items: [
          expect.objectContaining({ key: 'firstName', defaultValue: 'Lukas' }),
          expect.objectContaining({ label: 'Zusatzfrage', builtin: false }),
        ],
      }),
    })
  );
  expect(
    vi
      .mocked(apiJson.put)
      .mock.calls.every(
        ([path]) => path === '/worker/engagements/engagement/questionnaire'
      )
  ).toBe(true);
});

it('keeps a BSB answer typed in the preview for this engagement', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    ...draft,
    data: {
      ...draft.data,
      questions: [
        {
          key: 'salary',
          label: 'Gehalt',
          section: 'BSB',
          type: 'text',
          bsbOnly: true,
        },
      ],
    },
  });
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  const salary = await screen.findByRole('textbox', { name: 'Gehalt' });
  expect(salary).toBeEnabled();
  expect(salary).toHaveClass('bg-muted');
  await user.type(salary, '3200');
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire',
    expect.objectContaining({
      values: expect.objectContaining({ salary: '3200' }),
      definition: expect.objectContaining({
        items: [
          expect.objectContaining({
            key: 'salary',
            bsbOnly: true,
            defaultValue: '3200',
          }),
        ],
      }),
    })
  );
});

it('does not offer editing after sending', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    ...draft,
    data: { ...draft.data, sent: true },
  });
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={vi.fn()} />
  );
  await screen.findByRole('heading', { name: 'Personalfragebogen' });
  expect(
    screen.queryByRole('button', { name: 'Bearbeiten' })
  ).not.toBeInTheDocument();
});

it('preserves all weekday and built-in table office-only edits for an individual engagement', async () => {
  const { weeklyHoursFields } =
    await import('@/features/settings/questionnaire/weeklyHoursFields');
  vi.mocked(apiJson.get).mockResolvedValueOnce({
    ...draft,
    data: {
      ...draft.data,
      items: [
        ...weeklyHoursFields(),
        {
          kind: 'repeater',
          key: 'children',
          section: 'Kinder',
          columns: [{ key: 'lastName', label: 'Name', type: 'text' }],
        },
      ],
    },
  });
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  await user.click(await screen.findByRole('button', { name: 'Bearbeiten' }));
  const switches = screen.getAllByRole('switch', { name: 'Nur vom Betrieb' });
  expect(switches).toHaveLength(2);
  await user.click(switches[0]);
  await user.click(switches[1]);
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire',
    expect.objectContaining({
      definition: expect.objectContaining({
        items: [
          ...weeklyHoursFields().map((field, index) =>
            index === 0
              ? field
              : expect.objectContaining({ key: field.key, officeOnly: true })
          ),
          expect.objectContaining({
            key: 'children',
            columns: [expect.objectContaining({ officeOnly: true })],
          }),
        ],
      }),
    })
  );
});
