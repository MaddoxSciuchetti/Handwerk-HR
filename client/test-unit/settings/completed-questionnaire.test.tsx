import { CompletedQuestionnaireEditor } from '@/features/worker-task-management/components/files/CompletedQuestionnaireEditor';
import type { CompletedQuestionnaire } from '@/features/worker-task-management/components/files/EngagementQuestionnaireList';
import { EngagementQuestionnaireList } from '@/features/worker-task-management/components/files/EngagementQuestionnaireList';
import { apiJson } from '@/config/apiClient';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
});

it('opens the completed Fragebogen directly in the editable form', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
      revision: 0,
      name: 'Personalbogen Baustelle',
      intro: 'Saved introduction',
      items: [
        {
          kind: 'field',
          key: 'name',
          label: 'Familienname',
          section: 'Persönliche Angaben',
          type: 'text',
        },
        {
          kind: 'field',
          key: 'declaration',
          label: 'Erklärung',
          section: 'Persönliche Angaben',
          type: 'check',
        },
        {
          kind: 'repeater',
          key: 'children',
          section: 'Kinder',
          columns: [{ key: 'birthday', label: 'Geburtsdatum', type: 'date' }],
        },
      ],
      answers: {
        name: 'Lovelace',
        declaration: 'ja',
        children: [{ birthday: '2018-04-01' }],
      },
    },
  });
  renderWithProviders(
    <EngagementQuestionnaireList
      workerId="worker"
      questionnaires={[
        {
          id: 'one',
          engagementId: 'engagement-one',
          engagementLabel: 'Eintritt · 01.10.2026',
        },
        {
          id: 'two',
          engagementId: 'engagement-two',
          engagementLabel: 'Eintritt · 01.11.2026',
        },
      ]}
    />
  );
  expect(screen.queryByText(/Ausgefüllt/)).not.toBeInTheDocument();
  const entries = screen.getAllByRole('button', { name: 'Fragebogen' });
  await user.click(entries[1]);
  expect(
    await screen.findByRole('textbox', { name: 'Familienname' })
  ).toHaveValue('Lovelace');
  expect(screen.getByText('Personalbogen Baustelle')).toBeInTheDocument();
  expect(screen.getByText('Saved introduction')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Bearbeiten' })
  ).not.toBeInTheDocument();
  expect(apiJson.get).toHaveBeenCalledWith(
    'worker/worker/engagements/engagement-two/questionnaire/completed'
  );
  await user.click(screen.getByRole('button', { name: 'Schließen' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('does not render an entry when there are no completed questionnaires', () => {
  renderWithProviders(
    <EngagementQuestionnaireList workerId="worker" questionnaires={[]} />
  );
  expect(screen.queryByText('Fragebogen')).not.toBeInTheDocument();
});

it('shows a load error without displaying answers when the request fails', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.mocked(apiJson.get).mockRejectedValue(new Error('Not found'));
  renderWithProviders(
    <EngagementQuestionnaireList
      workerId="worker"
      questionnaires={[
        {
          id: 'failed',
          engagementId: 'failed-engagement',
          engagementLabel: 'Eintritt',
        },
      ]}
    />
  );
  await user.click(screen.getAllByRole('button', { name: /Fragebogen/ })[0]!);
  expect(
    await screen.findByText(
      'Der ausgefüllte Fragebogen konnte nicht geladen werden.'
    )
  ).toBeInTheDocument();
});

const editableQuestionnaire = {
  revision: 0,
  intro: 'Saved introduction',
  items: [
    {
      kind: 'field',
      key: 'lastName',
      label: 'Familienname',
      section: 'Person',
      type: 'text',
    },
  ],
  answers: { lastName: 'Wrong' },
};

async function openEditable() {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.mocked(apiJson.get).mockResolvedValue({ data: editableQuestionnaire });
  renderWithProviders(
    <EngagementQuestionnaireList
      workerId="worker"
      questionnaires={[
        { id: 'one', engagementId: 'eng', engagementLabel: 'Eintritt' },
      ]}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Fragebogen' }));
  const input = await screen.findByRole('textbox', { name: 'Familienname' });
  await user.clear(input);
  await user.type(input, 'Correct');
  return user;
}

it('autosaves corrections with the revision after a short delay', async () => {
  let finishSave!: (value: { data: CompletedQuestionnaire }) => void;
  vi.mocked(apiJson.put).mockImplementation(
    () =>
      new Promise((resolve) => {
        finishSave = resolve;
      })
  );
  await openEditable();
  expect(apiJson.put).not.toHaveBeenCalled();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  await waitFor(() => expect(apiJson.put).toHaveBeenCalled());
  expect(apiJson.put).toHaveBeenCalledWith(
    'worker/worker/engagements/eng/questionnaire/completed',
    {
      revision: 0,
      answers: { lastName: 'Correct' },
    }
  );
  expect(screen.getByRole('status', { name: 'Speichert…' })).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Familienname' })).toBeDisabled();
  await act(async () => {
    finishSave({
      data: {
        ...editableQuestionnaire,
        revision: 1,
        answers: { lastName: 'Correct' },
      },
    });
  });
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Familienname' })).toBeEnabled()
  );
  expect(screen.getByRole('textbox', { name: 'Familienname' })).toHaveValue(
    'Correct'
  );
  expect(
    screen.queryByRole('status', { name: 'Speichert…' })
  ).not.toBeInTheDocument();
});

it('keeps entered corrections when autosave fails', async () => {
  vi.mocked(apiJson.put).mockRejectedValue({ status: 409 });
  await openEditable();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'inzwischen geändert'
  );
  expect(screen.getByRole('textbox', { name: 'Familienname' })).toHaveValue(
    'Correct'
  );
});

it('keeps the original edit revision when newer answers arrive in the background', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  vi.mocked(apiJson.put).mockRejectedValue({ status: 409 });
  const initial = editableQuestionnaire as CompletedQuestionnaire;
  const onClose = vi.fn();
  const onBusy = vi.fn();
  const view = renderWithProviders(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={initial}
      onClose={onClose}
      onBusy={onBusy}
    />
  );
  const input = screen.getByRole('textbox', { name: 'Familienname' });
  await user.clear(input);
  await user.type(input, 'My correction');
  view.rerender(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={{
        ...initial,
        revision: 1,
        answers: { lastName: 'Another editor' },
      }}
      onClose={onClose}
      onBusy={onBusy}
    />
  );
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  await waitFor(() =>
    expect(apiJson.put).toHaveBeenCalledWith(
      'worker/worker/engagements/eng/questionnaire/completed',
      {
        revision: 0,
        answers: { lastName: 'My correction' },
      }
    )
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'inzwischen geändert'
  );
});

it('allows correcting completed questionnaire data alongside empty legacy office-only fields', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const initial = {
    ...editableQuestionnaire,
    items: [
      ...editableQuestionnaire.items,
      {
        kind: 'field',
        key: 'officeSalary',
        label: 'Gehalt',
        section: 'Office',
        type: 'text',
        required: true,
        bsbOnly: true,
      },
    ],
    answers: { ...editableQuestionnaire.answers, officeSalary: '' },
  } as CompletedQuestionnaire;
  vi.mocked(apiJson.put).mockResolvedValue({
    data: { ...initial, revision: 1, answers: { lastName: 'Correct', officeSalary: '' } },
  });
  renderWithProviders(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={initial}
      onClose={vi.fn()}
      onBusy={vi.fn()}
    />
  );
  expect(screen.getByRole('textbox', { name: 'Gehalt' })).toBeEnabled();
  const input = screen.getByRole('textbox', { name: 'Familienname' });
  await user.clear(input);
  await user.type(input, 'Correct');
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  await waitFor(() =>
    expect(apiJson.put).toHaveBeenCalledWith(
      'worker/worker/engagements/eng/questionnaire/completed',
      {
        revision: 0,
        answers: { lastName: 'Correct' },
      }
    )
  );
});
