import { ContractQuestionnaireSync } from '@/features/worker-task-management/components/files/ContractQuestionnaireSync';
import { resyncEngagementContractFromQuestionnaire } from '@/features/worker-task-management/api/employmentContract.api';
import type { EmploymentContractDraft } from '@/features/worker-task-management/api/employmentContract.api';
import { renderWithProviders } from './test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/features/worker-task-management/api/employmentContract.api', () => ({
  resyncEngagementContractFromQuestionnaire: vi.fn(),
}));
const contract = {
  status: 'draft',
  sentAt: null,
  questionnaireSyncNeeded: true,
  values: { name: 'Wrong' },
} as unknown as EmploymentContractDraft;
beforeEach(() => vi.clearAllMocks());

it('offers Sync for changed questionnaire data and applies the response only after clicking', async () => {
  const onSynced = vi.fn();
  const saved = {
    ...contract,
    questionnaireSyncNeeded: false,
    values: { name: 'Correct' },
  };
  vi.mocked(resyncEngagementContractFromQuestionnaire).mockResolvedValue(saved);
  const view = renderWithProviders(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={contract}
      onSynced={onSynced}
    />
  );
  expect(resyncEngagementContractFromQuestionnaire).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Sync' }));
  await waitFor(() => expect(onSynced).toHaveBeenCalledWith(saved));
  expect(resyncEngagementContractFromQuestionnaire).toHaveBeenCalledWith(
    'worker',
    'eng'
  );
  view.rerender(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={saved}
      onSynced={onSynced}
    />
  );
  expect(
    screen.queryByRole('button', { name: 'Sync' })
  ).not.toBeInTheDocument();
});

it('keeps the prompt available after a failed sync', async () => {
  const onSynced = vi.fn();
  vi.mocked(resyncEngagementContractFromQuestionnaire).mockRejectedValue(
    new Error('failed')
  );
  renderWithProviders(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={contract}
      onSynced={onSynced}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Sync' }));
  expect(await screen.findByRole('button', { name: 'Sync' })).toBeEnabled();
  expect(onSynced).not.toHaveBeenCalled();
});

it('does not offer to overwrite sent or signed contracts', () => {
  const { container } = renderWithProviders(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={{ ...contract, sentAt: '2026-10-20', status: 'signed' }}
      onSynced={vi.fn()}
    />
  );
  expect(container).toBeEmptyDOMElement();
  expect(
    screen.queryByRole('button', { name: 'Sync' })
  ).not.toBeInTheDocument();
});

it('does not sync when saving pending edits fails', async () => {
  const beforeSync = vi.fn().mockRejectedValue(new Error('Save failed'));
  const onSynced = vi.fn();
  const onBusy = vi.fn();
  renderWithProviders(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={contract}
      beforeSync={beforeSync}
      onSynced={onSynced}
      onBusy={onBusy}
    />
  );
  await userEvent.click(screen.getByRole('button', { name: 'Sync' }));
  await waitFor(() => expect(onBusy).toHaveBeenLastCalledWith(false));
  expect(beforeSync).toHaveBeenCalledOnce();
  expect(resyncEngagementContractFromQuestionnaire).not.toHaveBeenCalled();
  expect(onSynced).not.toHaveBeenCalled();
});

it('does not offer questionnaire syncing after the contract is printed', () => {
  renderWithProviders(
    <ContractQuestionnaireSync
      workerId="worker"
      engagementId="eng"
      contract={{ ...contract, printedAt: '2026-10-29T12:00:00.000Z' }}
      onSynced={vi.fn()}
    />
  );
  expect(
    screen.queryByRole('button', { name: 'Sync?' })
  ).not.toBeInTheDocument();
});
