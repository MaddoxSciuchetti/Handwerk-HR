import { CompletedQuestionnaireEditor } from '@/features/worker-task-management/components/files/CompletedQuestionnaireEditor';
import type { CompletedQuestionnaire } from '@/features/worker-task-management/components/files/EngagementQuestionnaireList';
import { EngagementQuestionnaireList } from '@/features/worker-task-management/components/files/EngagementQuestionnaireList';
import { apiJson } from '@/config/apiClient';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(), put: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

it('opens saved answers for the selected engagement and renders a read-only preview', async () => {
  vi.mocked(apiJson.get).mockResolvedValue({
    success: true,
    data: {
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
  expect(screen.queryByText(/Eintritt/)).not.toBeInTheDocument();
  const entries = screen.getAllByRole('button', { name: 'Fragebogen' });
  await userEvent.click(entries[1]);
  expect(await screen.findByText('Lovelace')).toBeInTheDocument();
  expect(screen.getByText('Personalbogen Baustelle')).toBeInTheDocument();
  expect(screen.getByText('ja')).toBeInTheDocument();
  expect(screen.getByText('01.04.2018')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(apiJson.get).toHaveBeenCalledWith(
    'worker/worker/engagements/engagement-two/questionnaire/completed'
  );
  await userEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('does not render an entry when there are no completed questionnaires', () => {
  renderWithProviders(
    <EngagementQuestionnaireList workerId="worker" questionnaires={[]} />
  );
  expect(screen.queryByText('Fragebogen')).not.toBeInTheDocument();
});

it('shows a load error without displaying answers when the request fails', async () => {
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
  await userEvent.click(
    screen.getAllByRole('button', { name: /Fragebogen/ })[0]!
  );
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
  vi.mocked(apiJson.get).mockResolvedValue({ data: editableQuestionnaire });
  renderWithProviders(
    <EngagementQuestionnaireList
      workerId="worker"
      questionnaires={[
        { id: 'one', engagementId: 'eng', engagementLabel: 'Eintritt' },
      ]}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Fragebogen' }));
  await userEvent.click(
    await screen.findByRole('button', { name: 'Bearbeiten' })
  );
  const input = screen.getByRole('textbox', { name: 'Familienname' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Correct');
}

it('saves corrections only on explicit save, including the revision', async () => {
  vi.mocked(apiJson.put).mockResolvedValue({
    data: {
      ...editableQuestionnaire,
      revision: 1,
      answers: { lastName: 'Correct' },
    },
  });
  await openEditable();
  expect(apiJson.put).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(apiJson.put).toHaveBeenCalledWith(
    'worker/worker/engagements/eng/questionnaire/completed',
    {
      revision: 0,
      answers: { lastName: 'Correct' },
    }
  );
  expect(await screen.findByText('Correct')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

it('discards edits on cancel without saving', async () => {
  await openEditable();
  await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
  expect(await screen.findByText('Wrong')).toBeInTheDocument();
  expect(apiJson.put).not.toHaveBeenCalled();
});

it('keeps entered corrections when saving fails', async () => {
  vi.mocked(apiJson.put).mockRejectedValue({ status: 409 });
  await openEditable();
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'inzwischen geändert'
  );
  expect(screen.getByRole('textbox', { name: 'Familienname' })).toHaveValue(
    'Correct'
  );
});

it('keeps the original edit revision when newer answers arrive in the background', async () => {
  vi.mocked(apiJson.put).mockRejectedValue({ status: 409 });
  const initial = editableQuestionnaire as CompletedQuestionnaire;
  const onDone = vi.fn();
  const onBusy = vi.fn();
  const view = renderWithProviders(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={initial}
      onDone={onDone}
      onBusy={onBusy}
    />
  );
  const input = screen.getByRole('textbox', { name: 'Familienname' });
  await userEvent.clear(input);
  await userEvent.type(input, 'My correction');
  view.rerender(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={{
        ...initial,
        revision: 1,
        answers: { lastName: 'Another editor' },
      }}
      onDone={onDone}
      onBusy={onBusy}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(apiJson.put).toHaveBeenCalledWith(
    'worker/worker/engagements/eng/questionnaire/completed',
    {
      revision: 0,
      answers: { lastName: 'My correction' },
    }
  );
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'inzwischen geändert'
  );
});

it('allows correcting completed questionnaire data alongside empty legacy office-only fields', async () => {
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
    data: { ...initial, revision: 1 },
  });
  renderWithProviders(
    <CompletedQuestionnaireEditor
      workerId="worker"
      engagementId="eng"
      questionnaire={initial}
      onDone={vi.fn()}
      onBusy={vi.fn()}
    />
  );
  expect(screen.getByRole('textbox', { name: 'Gehalt' })).toBeEnabled();
  const input = screen.getByRole('textbox', { name: 'Familienname' });
  await userEvent.clear(input);
  await userEvent.type(input, 'Correct');
  await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));
  expect(apiJson.put).toHaveBeenCalledWith(
    'worker/worker/engagements/eng/questionnaire/completed',
    {
      revision: 0,
      answers: { lastName: 'Correct' },
    }
  );
});
