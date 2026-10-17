import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { EngagementTemplateDocuments } from '@/features/worker-task-management/components/files/EngagementTemplateDocuments';
import {
  createTemplateDocument,
  getTemplateDocument,
  listTemplateDocuments,
  printTemplateDocument,
  saveTemplateDocument,
  syncTemplateDocument,
} from '@/features/worker-task-management/api/templateDocument.api';
import { printPdfBlob } from '@/features/worker-task-management/printPdf';
import { useDocumentMasters } from '@/features/settings/documents/useDocumentMasters';
import { fromSegments } from '@/features/settings/documents/styledDocument';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/features/worker-task-management/printPdf', () => ({
  printPdfBlob: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/features/settings/documents/useDocumentMasters', () => ({
  useDocumentMasters: vi.fn(),
}));
vi.mock('@/features/worker-task-management/api/templateDocument.api', () => ({
  listTemplateDocuments: vi.fn(),
  createTemplateDocument: vi.fn(),
  getTemplateDocument: vi.fn(),
  saveTemplateDocument: vi.fn(),
  syncTemplateDocument: vi.fn(),
  printTemplateDocument: vi.fn(),
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

const draft = {
  id: 'doc-1',
  engagementId: 'engagement',
  masterId: 'kfz',
  name: 'KFZ-Bescheinigung',
  kind: 'kfz_ueberlassungsvertrag' as const,
  segments: [{ type: 'input' as const, key: 'worker.vorname', label: 'Vorname' }],
  document: fromSegments([
    { type: 'input' as const, key: 'worker.vorname', label: 'Vorname' },
  ]),
  values: {} as Record<string, string>,
  unmatchedAnswers: [],
  masterRevision: 1,
  matchedMasterRevision: null,
  questionnaireCompleted: true,
};

function renderDocuments() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EngagementTemplateDocuments workerId="worker" engagementId="engagement" />
    </QueryClientProvider>
  );
}

it('creates a template document, confirms sync, and prints the filled values', async () => {
  vi.mocked(useDocumentMasters).mockReturnValue({
    data: [
      {
        id: 'kfz',
        name: 'KFZ-Bescheinigung',
        kind: 'kfz_ueberlassungsvertrag',
        isPrimary: false,
        updatedAt: '2026-10-17T00:00:00.000Z',
      },
    ],
    isPending: false,
    isError: false,
  } as ReturnType<typeof useDocumentMasters>);
  vi.mocked(listTemplateDocuments).mockResolvedValue([]);
  vi.mocked(createTemplateDocument).mockResolvedValue(draft);
  vi.mocked(getTemplateDocument).mockResolvedValue(draft);
  vi.mocked(syncTemplateDocument).mockResolvedValue({
    ...draft,
    values: { 'worker.vorname': 'Ada' },
  });
  vi.mocked(saveTemplateDocument).mockResolvedValue({
    ...draft,
    values: { 'worker.vorname': 'Ada' },
  });
  vi.mocked(printTemplateDocument).mockResolvedValue(
    new Blob(['%PDF'], { type: 'application/pdf' })
  );

  const user = userEvent.setup();
  renderDocuments();

  await user.click(await screen.findByRole('button', { name: 'Aus Vorlage' }));
  await user.click(
    await screen.findByRole('button', { name: /KFZ-Bescheinigung/ })
  );

  expect(createTemplateDocument).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'kfz'
  );
  expect(await screen.findByRole('heading', { name: 'KFZ-Bescheinigung' })).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: 'Abgleichen' }));
  expect(
    screen.getByText(/ersetzt alle Eingaben durch die Antworten des Fragebogens/)
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Werte ersetzen' }));

  expect(syncTemplateDocument).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'doc-1'
  );
  expect(await screen.findByRole('textbox', { name: 'Vorname' })).toHaveValue('Ada');

  await user.click(screen.getByRole('button', { name: 'Drucken' }));
  expect(saveTemplateDocument).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'doc-1',
    { 'worker.vorname': 'Ada' }
  );
  expect(printTemplateDocument).toHaveBeenCalledWith(
    'worker',
    'engagement',
    'doc-1',
    { 'worker.vorname': 'Ada' }
  );
  expect(printPdfBlob).toHaveBeenCalled();
});
