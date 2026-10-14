import { EngagementQuestionnaireList } from '@/features/worker-task-management/components/files/EngagementQuestionnaireList';
import { apiJson } from '@/config/apiClient';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from 'test-unit/test-utils';
import { expect, it, vi } from 'vitest';

vi.mock('@/config/apiClient', () => ({ apiJson: { get: vi.fn() } }));

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
  await userEvent.click(screen.getByRole('button', { name: /01.11.2026/ }));
  expect(await screen.findByText('Lovelace')).toBeInTheDocument();
  expect(screen.getByText('Personalbogen Baustelle')).toBeInTheDocument();
  expect(screen.getByText('ja')).toBeInTheDocument();
  expect(screen.getByText('01.04.2018')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(apiJson.get).toHaveBeenCalledWith(
    'worker/worker/engagements/engagement-two/questionnaire/completed'
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Modal schließen' })
  );
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
  await userEvent.click(screen.getByRole('button', { name: /Fragebogen/ }));
  expect(
    await screen.findByText(
      'Der ausgefüllte Fragebogen konnte nicht geladen werden.'
    )
  ).toBeInTheDocument();
});
