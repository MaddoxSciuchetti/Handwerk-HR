import { QuestionnaireSendDialog } from '@/features/questionnaire/QuestionnaireSendDialog';
import { apiJson } from '@/config/apiClient';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { ALL_WORKER_DATA } from '@/features/worker-lifecycle/consts/query-key.consts';
import { FETCHDESCRIPTION } from '@/features/all-tasks/consts/query.consts';
import {
  PERSONNEL_DOCUMENTS,
  WORKERBYID,
} from '@/features/worker-task-management/consts/query-key.consts';
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
    workerId: 'worker',
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

it.each([false, true])(
  'refreshes the provider cache immediately after sending (mock: %s)',
  async (mockCompleted) => {
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const commonKeys = [
      [ALL_WORKER_DATA],
      [ALL_WORKER_DATA, 'detail', 'worker'],
      [WORKERBYID, 'worker'],
      ['employment-contract', 'worker', 'engagement'],
    ];
    const completedKeys = [
      ['completed-questionnaire', 'worker', 'engagement'],
      [PERSONNEL_DOCUMENTS, 'worker'],
    ];
    const unrelatedKeys = [
      [WORKERBYID, 'other-worker'],
      ['employment-contract', 'other-worker', 'other-engagement'],
      ['completed-questionnaire', 'other-worker', 'other-engagement'],
      [PERSONNEL_DOCUMENTS, 'other-worker'],
    ];
    for (const key of [...commonKeys, ...completedKeys, ...unrelatedKeys])
      cache.setQueryData(key, {});
    const fetchTasks = vi.fn(() => new Promise<never>(() => {}));
    cache.setQueryData([FETCHDESCRIPTION], []);
    function TaskList() {
      useQuery({ queryKey: [FETCHDESCRIPTION], queryFn: fetchTasks });
      return null;
    }
    vi.mocked(apiJson.post).mockResolvedValue({
      success: true,
      data: { emailSent: !mockCompleted, mockCompleted },
    });
    const onClose = vi.fn();
    const view = render(
      <QueryClientProvider client={cache}>
        <TaskList />
        <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
      </QueryClientProvider>
    );
    await userEvent.click(
      await screen.findByRole('button', { name: 'Senden' })
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(fetchTasks).toHaveBeenCalledOnce();
    for (const key of commonKeys)
      expect(cache.getQueryState(key)?.isInvalidated).toBe(true);
    for (const key of completedKeys)
      expect(cache.getQueryState(key)?.isInvalidated).toBe(mockCompleted);
    for (const key of unrelatedKeys)
      expect(cache.getQueryState(key)?.isInvalidated).toBe(false);
    expect(
      cache.getQueryData(['questionnaire-draft', 'engagement'])
    ).toMatchObject({
      data: { sent: true, status: mockCompleted ? 'completed' : 'sent' },
    });
    view.unmount();
    cache.clear();
  }
);

it('sends with Enter after the dialog loads', async () => {
  vi.mocked(apiJson.post).mockResolvedValue({
    success: true,
    data: { emailSent: true },
  });
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Senden' })).toBeEnabled()
  );
  await userEvent.keyboard('{Enter}');
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(apiJson.put).toHaveBeenCalledOnce();
  expect(apiJson.post).toHaveBeenCalledExactlyOnceWith(
    '/worker/engagements/engagement/questionnaire/send'
  );
});

it('does not send with Enter while editing', async () => {
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={vi.fn()} />
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Bearbeiten' })
  );
  fireEvent.keyDown(screen.getByRole('textbox', { name: 'Antwort' }), {
    key: 'Enter',
  });
  expect(apiJson.post).not.toHaveBeenCalled();
});

it('does not resend a sent questionnaire with Enter', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    ...draft,
    data: { ...draft.data, sent: true, mockEnabled: false },
  });
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={vi.fn()} />
  );
  await screen.findByRole('heading', { name: 'Personalfragebogen' });
  expect(screen.getByRole('button', { name: 'Senden' })).toBeDisabled();
  await userEvent.keyboard('{Enter}');
  expect(apiJson.post).not.toHaveBeenCalled();
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

it('opens the worker preview and edits structure only through Bearbeiten', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();
  renderWithProviders(
    <QuestionnaireSendDialog engagementId="engagement" onClose={onClose} />
  );
  await screen.findByRole('heading', { name: 'Personalfragebogen' });
  expect(
    screen.queryByRole('button', { name: 'Absenden' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('textbox', { name: 'Antwort' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Bearbeiten' }));
  expect(screen.getByRole('textbox', { name: 'Frage' })).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Antwort' }), 'Lukas');
  await user.click(
    screen.getAllByRole('button', {
      name: 'Frage oder Überschrift hier einfügen',
    })[0]!
  );
  await user.click(screen.getByRole('button', { name: 'Frage' }));
  await user.type(screen.getByPlaceholderText('Frage'), 'Zusatzfrage');
  await user.click(screen.getByRole('button', { name: 'Hinzufügen' }));
  await user.click(screen.getByRole('button', { name: 'Fertig' }));
  expect(screen.getByLabelText(/^Vorname/)).toHaveValue('Lukas');
  expect(screen.getByLabelText(/^Zusatzfrage/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire',
    expect.objectContaining({
      definition: expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ key: 'firstName', defaultValue: 'Lukas' }),
          expect.objectContaining({ label: 'Zusatzfrage', builtin: false }),
        ]),
      }),
    })
  );
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
  await user.type(salary, '3200');
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  await waitFor(() => expect(onClose).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    '/worker/engagements/engagement/questionnaire',
    expect.objectContaining({
      values: expect.objectContaining({ salary: '3200' }),
      definition: expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            key: 'salary',
            bsbOnly: true,
            defaultValue: '3200',
          }),
        ]),
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
        items: expect.arrayContaining([
          ...weeklyHoursFields().map((field, index) =>
            index === 0
              ? expect.objectContaining({ key: field.key })
              : expect.objectContaining({ key: field.key, officeOnly: true })
          ),
          expect.objectContaining({
            key: 'children',
            columns: [expect.objectContaining({ officeOnly: true })],
          }),
        ]),
      }),
    })
  );
});
