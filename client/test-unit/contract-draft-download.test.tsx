import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { ContractDraftDialog } from '@/features/worker-task-management/components/files/ContractDraftDialog';
import {
  fetchPreparedEmploymentContractPdf,
  getEngagementContract,
  prepareEmploymentContractPdf,
} from '@/features/worker-task-management/api/employmentContract.api';
import { fromSegments } from '@/features/settings/documents/styledDocument';

beforeEach(() => vi.clearAllMocks());

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/api/employmentContract.api', () => ({
  fetchPreparedEmploymentContractPdf: vi.fn(),
  prepareEmploymentContractPdf: vi.fn(),
  getEngagementContract: vi.fn(),
  saveEngagementContractDraft: vi.fn(),
  resyncEngagementContractFromQuestionnaire: vi.fn(),
}));

vi.mock(
  '@/features/worker-task-management/components/files/ContractDraftBody',
  () => ({
    ContractDraftBody: () => <div>Vertragsentwurf</div>,
  })
);

vi.mock(
  '@/features/worker-task-management/components/files/ContractQuestionnaireSync',
  () => ({
    ContractQuestionnaireSync: () => null,
  })
);

const draft = {
  id: 'contract',
  engagementId: 'engagement',
  masterId: 'master',
  status: 'draft' as const,
  name: 'Arbeitsvertrag',
  followsMaster: true,
  segments: [],
  document: fromSegments([]),
  values: {},
  unmatchedAnswers: [],
  masterRevision: 1,
  matchedMasterRevision: 1,
  questionnaireCompleted: true,
  sentAt: null,
  signedFileUrl: null,
  outgoingFileUrl: null,
  prepared: null,
};

it('downloads the Arbeitsvertrag PDF from the Dateien dialog', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue(draft);
  vi.mocked(prepareEmploymentContractPdf).mockResolvedValue({
    id: 'pdf-1',
    previewUrl: 'https://example.test/contract.pdf',
    contentHash: 'hash',
    masterRevision: 1,
  });
  vi.mocked(fetchPreparedEmploymentContractPdf).mockResolvedValue(
    new Blob(['%PDF'], { type: 'application/pdf' })
  );
  const create = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:contract');
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={query}>
      <ContractDraftDialog
        workerId="worker"
        engagementId="engagement"
        onClose={() => undefined}
      />
    </QueryClientProvider>
  );

  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'PDF herunterladen' }));

  await waitFor(() =>
    expect(prepareEmploymentContractPdf).toHaveBeenCalledWith(
      'worker',
      'engagement',
      {}
    )
  );
  expect(fetchPreparedEmploymentContractPdf).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'pdf-1'
  );
  expect(click.mock.instances[0]).toHaveAttribute(
    'download',
    'Arbeitsvertrag.pdf'
  );
  create.mockRestore();
  click.mockRestore();
});

it('reuses an existing prepared PDF when values are unchanged', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue({
    ...draft,
    prepared: {
      id: 'pdf-ready',
      previewUrl: 'https://example.test/contract.pdf',
      contentHash: 'hash',
      masterRevision: 1,
    },
  });
  vi.mocked(fetchPreparedEmploymentContractPdf).mockResolvedValue(
    new Blob(['%PDF'], { type: 'application/pdf' })
  );
  const create = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:contract');
  const click = vi
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={query}>
      <ContractDraftDialog
        workerId="worker"
        engagementId="engagement"
        onClose={() => undefined}
      />
    </QueryClientProvider>
  );

  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'PDF herunterladen' }));

  await waitFor(() =>
    expect(fetchPreparedEmploymentContractPdf).toHaveBeenCalledWith(
      'worker',
      'engagement',
      'pdf-ready'
    )
  );
  expect(prepareEmploymentContractPdf).not.toHaveBeenCalled();
  create.mockRestore();
  click.mockRestore();
});
