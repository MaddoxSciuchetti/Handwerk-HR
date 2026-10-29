import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { ContractDraftDialog } from '@/features/worker-task-management/components/files/ContractDraftDialog';
import {
  fetchPreparedEmploymentContractPdf,
  fetchPrintedEmploymentContractPdf,
  getEngagementContract,
  prepareEmploymentContractDownload,
  saveEngagementContractDraft,
} from '@/features/worker-task-management/api/employmentContract.api';
import { fromSegments } from '@/features/settings/documents/styledDocument';

beforeEach(() => vi.clearAllMocks());

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/api/employmentContract.api', () => ({
  fetchPreparedEmploymentContractPdf: vi.fn(),
  fetchPrintedEmploymentContractPdf: vi.fn(),
  prepareEmploymentContractDownload: vi.fn(),
  getEngagementContract: vi.fn(),
  saveEngagementContractDraft: vi.fn(),
  resyncEngagementContractFromQuestionnaire: vi.fn(),
}));

vi.mock(
  '@/features/worker-task-management/components/files/ContractDraftBody',
  () => ({
    ContractDraftBody: ({ readOnly }: { readOnly: boolean }) => (
      <div data-readonly={readOnly}>Vertragsentwurf</div>
    ),
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

it('keeps an unsent ready contract editable and saveable when opened from Dateien', async () => {
  const ready = { ...draft, status: 'ready' as const };
  vi.mocked(getEngagementContract).mockResolvedValue(ready);
  vi.mocked(saveEngagementContractDraft).mockResolvedValue(draft);
  const onClose = vi.fn();
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={query}>
      <ContractDraftDialog
        workerId="worker"
        engagementId="engagement"
        onClose={onClose}
      />
    </QueryClientProvider>
  );
  expect(await screen.findByText('Vertragsentwurf')).toHaveAttribute(
    'data-readonly',
    'false'
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Entwurf speichern' })
  );
  await waitFor(() =>
    expect(saveEngagementContractDraft).toHaveBeenCalledWith(
      'worker',
      'engagement',
      {}
    )
  );
  expect(onClose).not.toHaveBeenCalled();
});

it('downloads the Arbeitsvertrag PDF from the Dateien dialog', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue(draft);
  vi.mocked(prepareEmploymentContractDownload).mockResolvedValue({
    blob: new Blob(['%PDF'], { type: 'application/pdf' }),
    prepared: {
      id: 'pdf-1',
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
    expect(prepareEmploymentContractDownload).toHaveBeenCalledWith(
      'worker',
      'engagement',
      {}
    )
  );
  expect(fetchPreparedEmploymentContractPdf).not.toHaveBeenCalled();
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
  expect(prepareEmploymentContractDownload).not.toHaveBeenCalled();
  create.mockRestore();
  click.mockRestore();
});

it('keeps a printed contract read-only and downloads its frozen PDF', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue({
    ...draft,
    printedAt: '2026-10-29T12:00:00.000Z',
    followsMaster: false,
    prepared: null,
  });
  vi.mocked(fetchPrintedEmploymentContractPdf).mockResolvedValue(
    new Blob(['%PDF-frozen'])
  );
  const create = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:frozen');
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
  await userEvent.click(
    await screen.findByRole('button', { name: 'PDF herunterladen' })
  );
  await waitFor(() =>
    expect(fetchPrintedEmploymentContractPdf).toHaveBeenCalledWith(
      'worker',
      'engagement'
    )
  );
  expect(prepareEmploymentContractDownload).not.toHaveBeenCalled();
  expect(saveEngagementContractDraft).not.toHaveBeenCalled();
  expect(screen.getByText('Vertragsentwurf')).toHaveAttribute(
    'data-readonly',
    'true'
  );
  expect(
    screen.queryByRole('button', { name: 'Entwurf speichern' })
  ).not.toBeInTheDocument();
  create.mockRestore();
  click.mockRestore();
});
