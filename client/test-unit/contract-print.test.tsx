import { act, render, screen, waitFor } from '@testing-library/react';
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
  selectEngagementContractTemplate,
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
vi.mock('@/features/worker-task-management/api/employmentContract.api', () => ({
  fetchPreparedEmploymentContractPdf: vi.fn(),
  prepareEmploymentContractPdf: vi.fn(),
  recordPrintedEmploymentContract: vi.fn(),
  getEngagementContract: vi.fn(),
  saveEngagementContractDraft: vi.fn(),
  resyncEngagementContractFromQuestionnaire: vi.fn(),
  confirmEngagementContractForSend: vi.fn(),
  selectEngagementContractTemplate: vi.fn(),
}));

vi.mock(
  '@/features/worker-task-management/components/files/ContractDraftBody',
  () => ({
    ContractDraftBody: ({
      values,
      onValueChange,
      segments,
    }: {
      values: Record<string, string>;
      onValueChange: (key: string, value: string) => void;
      segments: { type: string; key?: string; label?: string }[];
    }) => (
      <div>
        {segments
          .filter((segment) => segment.type === 'input')
          .map((segment) => (
            <input
              key={segment.key}
              aria-label={segment.label}
              value={values[segment.key!] ?? ''}
              onChange={(event) =>
                onValueChange(segment.key!, event.target.value)
              }
            />
          ))}
      </div>
    ),
  })
);

vi.mock('@/features/settings/documents/useDocumentMasters', () => ({
  useDocumentMasters: () => ({
    data: [
      { id: 'master', name: 'Arbeitsvertrag', kind: 'employment_contract' },
      {
        id: 'other-master',
        name: 'Anderer Arbeitsvertrag',
        kind: 'employment_contract',
      },
      { id: 'certificate', name: 'Zeugnis', kind: 'arbeitszeugnis' },
    ],
    isPending: false,
    isError: false,
  }),
}));

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
  const saved = {
    ...draft,
    prepared: null,
    values: { 'contract.name': 'Ada' },
  };
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

it('hydrates fresh questionnaire values after opening with an empty cached draft and preserves manual edits', async () => {
  const segments = [
    { type: 'input' as const, key: 'contract.name', label: 'Vorname' },
  ];
  const cached = {
    ...draft,
    prepared: null,
    segments,
    document: fromSegments(segments),
    values: {},
    questionnaireCompleted: false,
  };
  const fresh = {
    ...cached,
    values: { 'contract.name': 'Lukas' },
    questionnaireCompleted: true,
    questionnaireAnswers: [
      { key: 'firstName', label: 'Vorname', value: 'Lukas' },
    ],
  };
  let resolve!: (value: typeof fresh) => void;
  vi.mocked(getEngagementContract).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    })
  );
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  query.setQueryData(['employment-contract', 'worker', 'engagement'], cached);
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
  expect(await screen.findByRole('textbox', { name: 'Vorname' })).toHaveValue(
    ''
  );
  await act(async () => resolve(fresh));
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Vorname' })).toHaveValue(
      'Lukas'
    )
  );
  const user = userEvent.setup();
  await user.clear(screen.getByRole('textbox', { name: 'Vorname' }));
  // A value placed by the server must reappear in the sidebar when cleared locally.
  expect(screen.getByText('Lukas')).toBeInTheDocument();
  await user.type(screen.getByRole('textbox', { name: 'Vorname' }), 'Manuell');
  act(() =>
    query.setQueryData(['employment-contract', 'worker', 'engagement'], {
      ...fresh,
      values: { 'contract.name': 'Server' },
    })
  );
  expect(screen.getByRole('textbox', { name: 'Vorname' })).toHaveValue(
    'Manuell'
  );
});

it('switches the prefilled contract template, rematches answers, and clears the old PDF approval', async () => {
  const fresh = {
    ...draft,
    masterId: 'other-master',
    name: 'Anderer Arbeitsvertrag',
    prepared: null,
    document: fromSegments([
      { type: 'input', key: 'other.name', label: 'Name' },
    ]),
    segments: [{ type: 'input' as const, key: 'other.name', label: 'Name' }],
    values: { 'other.name': 'Lukas Muster' },
  };
  vi.mocked(getEngagementContract).mockResolvedValue(draft);
  vi.mocked(selectEngagementContractTemplate).mockResolvedValue(fresh);
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
  const select = await screen.findByRole('combobox', {
    name: 'Vertragsvorlage',
  });
  expect(
    screen.queryByRole('option', { name: 'Zeugnis' })
  ).not.toBeInTheDocument();
  await user.selectOptions(select, 'other-master');
  await user.click(
    screen.getByRole('button', { name: 'Vorlage wechseln und neu ausfüllen' })
  );
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Lukas Muster'
    )
  );
  expect(selectEngagementContractTemplate).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'other-master'
  );
  expect(
    query.getQueryData(['employment-contract', 'worker', 'engagement'])
  ).toMatchObject({ masterId: 'other-master' });
  expect(
    screen.queryByTitle('Arbeitsvertrag zum Drucken')
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Drucken' })).toBeDisabled();
});

it('does not offer a template switch for a printed contract', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue({
    ...draft,
    sentAt: '2026-10-17T08:00:00Z',
  });
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
  await screen.findByText('Der Vertrag wurde gedruckt.');
  expect(
    screen.queryByRole('combobox', { name: 'Vertragsvorlage' })
  ).not.toBeInTheDocument();
});
