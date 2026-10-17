import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { ContractSendDialog } from '@/features/worker-task-management/components/files/ContractSendDialog';
import {
  fetchPreparedEmploymentContractPdf,
  getEngagementContract,
  prepareEmploymentContractPdf,
  recordPrintedEmploymentContract,
  saveEngagementContractDraft,
} from '@/features/worker-task-management/api/employmentContract.api';
import { printPdfBlob } from '@/features/worker-task-management/printPdf';
import { fromSegments } from '@/features/settings/documents/styledDocument';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/printPdf', () => ({
  printPdfBlob: vi.fn().mockResolvedValue(undefined),
}));
vi.mock(
  '@/features/worker-task-management/api/employmentContract.api',
  () => ({
    fetchPreparedEmploymentContractPdf: vi.fn(),
    prepareEmploymentContractPdf: vi.fn(),
    recordPrintedEmploymentContract: vi.fn(),
    getEngagementContract: vi.fn(),
    saveEngagementContractDraft: vi.fn(),
    resyncEngagementContractFromQuestionnaire: vi.fn(),
    confirmEngagementContractForSend: vi.fn(),
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
  prepared: {
    id: 'pdf-1',
    previewUrl: 'https://example.test/contract.pdf',
    contentHash: 'hash',
    masterRevision: 1,
  },
};

it('prints the reviewed contract instead of emailing it', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue(draft);
  vi.mocked(fetchPreparedEmploymentContractPdf).mockResolvedValue(
    new Blob(['%PDF'], { type: 'application/pdf' })
  );
  vi.mocked(recordPrintedEmploymentContract).mockResolvedValue(draft);
  const onClose = vi.fn();
  const user = userEvent.setup();
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={query}>
      <ContractSendDialog
        workerId="worker"
        engagementId="engagement"
        issueId="issue"
        onClose={onClose}
      />
    </QueryClientProvider>
  );

  expect(
    await screen.findByText(
      'Prüfen Sie den ausgefüllten Vertrag und drucken Sie ihn zur Unterschrift im Büro.'
    )
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Vertrag versenden' })
  ).not.toBeInTheDocument();
  const print = screen.getByRole('button', { name: 'Drucken' });
  expect(print).toBeDisabled();
  await user.click(
    screen.getByRole('checkbox', {
      name: 'Ich habe dieses PDF geprüft und drucke es zur Unterschrift im Büro.',
    })
  );
  await user.click(print);

  expect(fetchPreparedEmploymentContractPdf).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'pdf-1'
  );
  expect(printPdfBlob).toHaveBeenCalled();
  expect(recordPrintedEmploymentContract).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'issue',
    'pdf-1'
  );
  expect(onClose).toHaveBeenCalled();
});

it('saves the draft without preparing a pdf', async () => {
  const saved = { ...draft, prepared: null, values: { 'contract.name': 'Ada' } };
  vi.mocked(getEngagementContract).mockResolvedValue({
    ...draft,
    prepared: null,
    values: {},
  });
  vi.mocked(saveEngagementContractDraft).mockResolvedValue(saved);
  const user = userEvent.setup();
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={query}>
      <ContractSendDialog
        workerId="worker"
        engagementId="engagement"
        issueId="issue"
        onClose={() => undefined}
      />
    </QueryClientProvider>
  );

  await user.click(
    await screen.findByRole('button', { name: 'Entwurf speichern' })
  );

  expect(saveEngagementContractDraft).toHaveBeenCalledWith(
    'worker',
    'engagement',
    {}
  );
  expect(prepareEmploymentContractPdf).not.toHaveBeenCalled();
});
