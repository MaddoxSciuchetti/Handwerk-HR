import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, it, vi } from 'vitest';
import { ContractSendDialog } from '@/features/worker-task-management/components/files/ContractSendDialog';
import {
  fetchPreparedEmploymentContractPdf,
  getEngagementContract,
  prepareEmploymentContractPdf,
  prepareEmploymentContractDownload,
  saveEngagementContractDraft,
  selectEngagementContractTemplate,
  resyncEngagementContractFromQuestionnaire,
} from '@/features/worker-task-management/api/employmentContract.api';
import { fromSegments } from '@/features/settings/documents/styledDocument';

beforeEach(() => vi.clearAllMocks());

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/api/employmentContract.api', () => ({
  fetchPreparedEmploymentContractPdf: vi.fn(),
  prepareEmploymentContractPdf: vi.fn(),
  prepareEmploymentContractDownload: vi.fn(),
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

it('saves without printing, completing the task or closing, and allows later questionnaire sync', async () => {
  const saved = { ...draft, values: { 'contract.gehalt': '4000' } };
  vi.mocked(getEngagementContract).mockResolvedValue(saved);
  vi.mocked(saveEngagementContractDraft).mockResolvedValue(saved);
  vi.mocked(resyncEngagementContractFromQuestionnaire).mockResolvedValue({
    ...saved,
    questionnaireSyncNeeded: false,
  });
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
  await user.click(await screen.findByRole('button', { name: 'Speichern' }));
  await waitFor(() =>
    expect(saveEngagementContractDraft).toHaveBeenCalledWith(
      'worker',
      'engagement',
      saved.values
    )
  );
  expect(
    screen.queryByRole('button', { name: 'Drucken' })
  ).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  expect(prepareEmploymentContractPdf).not.toHaveBeenCalled();
  expect(prepareEmploymentContractDownload).not.toHaveBeenCalled();
  await act(async () => {
    query.setQueryData(['employment-contract', 'worker', 'engagement'], {
      ...saved,
      questionnaireSyncNeeded: true,
    });
  });
  await user.click(await screen.findByRole('button', { name: 'Sync?' }));
  await waitFor(() =>
    expect(resyncEngagementContractFromQuestionnaire).toHaveBeenCalledWith(
      'worker',
      'engagement'
    )
  );
  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Speichern' })).toBeEnabled();
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

  await user.click(await screen.findByRole('button', { name: 'Speichern' }));

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

it('syncs a newly selected template immediately and clears the old PDF', async () => {
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
    name: 'Vertragsvorlage wechseln',
  });
  expect(
    screen.queryByRole('option', { name: 'Zeugnis' })
  ).not.toBeInTheDocument();
  await user.selectOptions(select, 'other-master');
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
    screen.queryByTitle('Arbeitsvertrag PDF-Vorschau')
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'PDF herunterladen' })
  ).toBeEnabled();
});

it.each(['questionnaire', 'template'] as const)(
  'saves unsaved pay before syncing the %s',
  async (source) => {
    const initial = {
      ...draft,
      prepared: null,
      questionnaireSyncNeeded: true,
      segments: [
        { type: 'input' as const, key: 'contract.gehalt', label: 'Gehalt' },
      ],
      values: { 'contract.gehalt': '4000' },
    };
    const saved = { ...initial, values: { 'contract.gehalt': '4500' } };
    vi.mocked(getEngagementContract).mockResolvedValue(initial);
    vi.mocked(saveEngagementContractDraft).mockResolvedValue(saved);
    const syncApi =
      source === 'template'
        ? selectEngagementContractTemplate
        : resyncEngagementContractFromQuestionnaire;
    vi.mocked(syncApi).mockImplementation(async () => {
      expect(saveEngagementContractDraft).toHaveBeenCalledWith(
        'worker',
        'engagement',
        { 'contract.gehalt': '4500' }
      );
      return { ...saved, questionnaireSyncNeeded: false };
    });
    const query = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const user = userEvent.setup();
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
    const pay = await screen.findByRole('textbox', { name: 'Gehalt' });
    await user.clear(pay);
    await user.type(pay, '4500');
    if (source === 'template') {
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Vertragsvorlage wechseln' }),
        'other-master'
      );
    } else {
      await user.click(screen.getByRole('button', { name: 'Sync?' }));
    }
    await waitFor(() => expect(syncApi).toHaveBeenCalled());
    expect(saveEngagementContractDraft).toHaveBeenCalledWith(
      'worker',
      'engagement',
      { 'contract.gehalt': '4500' }
    );
    expect(
      vi.mocked(saveEngagementContractDraft).mock.invocationCallOrder[0]
    ).toBeLessThan(vi.mocked(syncApi).mock.invocationCallOrder[0]);
    await waitFor(() => expect(pay).toHaveValue('4500'));
  }
);

it('does not offer a template switch for a sent contract', async () => {
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
  await screen.findByTitle('Arbeitsvertrag PDF-Vorschau');
  expect(
    screen.queryByRole('combobox', { name: 'Vertragsvorlage wechseln' })
  ).not.toBeInTheDocument();
});

it('keeps the field column in the contract preview skeleton', () => {
  vi.mocked(getEngagementContract).mockReturnValue(
    new Promise(() => undefined)
  );
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

  const preview = screen.getByRole('status', {
    name: 'Vertragsvorschau wird geladen',
  });
  expect(
    preview.querySelector('[data-testid="contract-preview-fields"]')
  ).toBeInTheDocument();
  expect(
    preview.querySelector('[aria-label="PDF wird geladen"]')
  ).toBeInTheDocument();
});

it('downloads the prepared PDF without recording it as printed', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue(draft);
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
  const onClose = vi.fn();
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
  await userEvent
    .setup()
    .click(await screen.findByRole('button', { name: 'PDF herunterladen' }));
  await waitFor(() => expect(click).toHaveBeenCalled());
  expect(click.mock.instances[0]).toHaveAttribute(
    'download',
    'Arbeitsvertrag.pdf'
  );
  expect(onClose).not.toHaveBeenCalled();
  create.mockRestore();
  click.mockRestore();
});

it('downloads a newly generated PDF directly and reuses it on the next click', async () => {
  vi.mocked(getEngagementContract).mockResolvedValue({
    ...draft,
    prepared: null,
  });
  vi.mocked(prepareEmploymentContractDownload).mockResolvedValue({
    blob: new Blob(['%PDF'], { type: 'application/pdf' }),
    prepared: draft.prepared,
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
      <ContractSendDialog
        workerId="worker"
        engagementId="engagement"
        issueId="issue"
        onClose={() => undefined}
      />
    </QueryClientProvider>
  );
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole('button', { name: 'PDF herunterladen' })
  );
  await waitFor(() => expect(click).toHaveBeenCalledTimes(1));
  expect(fetchPreparedEmploymentContractPdf).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'PDF herunterladen' }));
  await waitFor(() => expect(click).toHaveBeenCalledTimes(2));
  expect(prepareEmploymentContractDownload).toHaveBeenCalledTimes(1);
  expect(fetchPreparedEmploymentContractPdf).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'pdf-1'
  );
  create.mockRestore();
  click.mockRestore();
});
