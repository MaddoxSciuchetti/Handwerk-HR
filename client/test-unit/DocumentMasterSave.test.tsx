import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, it, expect, afterEach } from 'vitest';
import { DocumentMasterEditor } from '@/features/settings/documents/DocumentMasterEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import {
  getDocumentMaster,
  updateDocumentMaster,
} from '@/features/settings/documents/documentMasters.api';
import { DOCUMENT_MASTERS_KEY } from '@/features/settings/documents/documentMaster.keys';
import type { DocumentMasterDetail } from '@/features/settings/documents/documentMaster.types';

vi.mock('@/features/settings/documents/documentMasters.api', () => ({
  getDocumentMaster: vi.fn(),
  updateDocumentMaster: vi.fn(),
  setPrimaryDocumentMaster: vi.fn(),
}));
vi.mock('@/config/apiClient', () => ({
  apiJson: { get: vi.fn(async () => ({ ready: false, available: [] })) },
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}));
vi.mock('@/features/settings/documents/DocumentPrintPreview', () => ({
  DocumentPrintPreview: ({ document }: { document?: unknown }) => <div>{document ? 'Draft PDF preview' : 'Saved PDF preview'}</div>,
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('saves without replacing the editor, jumping scroll, refreshing detail, or reloading the original', async () => {
  const original: DocumentMasterDetail = {
    id: 'master-1',
    name: 'Test master',
    kind: 'employment_contract',
    isPrimary: true,
    updatedAt: '2026-10-09',
    revision: 1,
    approvedAt: null,
    text: '',
    segments: [],
    document: fromSegments([
      { type: 'text', text: 'Stable paragraph\nSecond paragraph' },
    ]),
    sourceMime: 'application/pdf',
    sourceUrl: 'https://original.example/file.pdf',
  };
  vi.mocked(getDocumentMaster).mockResolvedValue(original);
  vi.mocked(updateDocumentMaster).mockImplementation(async (_id, input) => ({
    ...original,
    ...input,
    document: input.document!,
    revision: input.revision! + 1,
    sourceUrl: 'https://original.example/file.pdf?new-signature=1',
  }));
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const time = vi.spyOn(performance, 'now').mockReturnValue(100);
  const { container } = render(
    <QueryClientProvider client={query}>
      <DocumentMasterEditor id="master-1" />
    </QueryClientProvider>
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Original vergleichen' })
  );
  expect(container.querySelector('.tiptap')).toHaveAttribute(
    'contenteditable',
    'true'
  );
  expect(
    screen.queryByRole('button', { name: 'Bearbeiten' })
  ).not.toBeInTheDocument();
  time.mockReturnValue(1000);
  expect(
    screen.queryByRole('button', { name: /Vorlage freigeben/ })
  ).not.toBeInTheDocument();
  const editor = container.querySelector('.tiptap')!;
  const canvas = container.querySelector('.document-editor-canvas')!;
  canvas.scrollTop = 240;
  fireEvent.click(
    screen.getByRole('button', { name: 'Speichern', exact: true })
  );
  await waitFor(() =>
    expect(
      query.getQueryData<DocumentMasterDetail>([
        DOCUMENT_MASTERS_KEY,
        'master-1',
      ])?.revision
    ).toBe(2)
  );
  expect(container.querySelector('.tiptap')).toBe(editor);
  expect(editor).toHaveAttribute('contenteditable', 'true');
  expect(canvas.scrollTop).toBe(240);
  expect(screen.getByTitle('Originaldokument')).toHaveAttribute(
    'src',
    original.sourceUrl
  );
  expect(getDocumentMaster).toHaveBeenCalledTimes(1);
  expect(updateDocumentMaster).toHaveBeenCalledWith(
    'master-1',
    expect.objectContaining({ approved: true })
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Speichern', exact: true })
    ).toBeEnabled()
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Speichern', exact: true })
  );
  await waitFor(() => expect(updateDocumentMaster).toHaveBeenCalledTimes(2));
  expect(vi.mocked(updateDocumentMaster).mock.calls[1][1].revision).toBe(2);
  expect(screen.queryByRole('button', { name: 'Abbrechen' })).not.toBeInTheDocument();
  const preview = screen.getByRole('button', { name: 'Vorschau', exact: true });
  expect(preview.closest('.fixed')).toBeNull();
  fireEvent.click(preview);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText('Draft PDF preview')).toBeInTheDocument();
  expect(container.querySelector('.tiptap')).toBe(editor);
  expect(updateDocumentMaster).toHaveBeenCalledTimes(2);
});

it('autosaves a renamed master on blur and Enter without changing its document or approval', async () => {
  const original: DocumentMasterDetail = {
    id: 'rename-master', name: 'Old name', kind: 'employment_contract',
    isPrimary: true, updatedAt: '2026-10-17', revision: 3,
    approvedAt: '2026-10-17', text: '', segments: [],
    document: fromSegments([{ type: 'text', text: 'Saved contract' }]),
  };
  vi.mocked(getDocumentMaster).mockResolvedValue(original);
  vi.mocked(updateDocumentMaster).mockImplementation(async (_id, input) => ({
    ...original, ...input, document: input.document!, revision: input.revision! + 1,
  }));
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={query}>
      <DocumentMasterEditor id="rename-master" />
    </QueryClientProvider>
  );
  const input = await screen.findByRole('textbox', { name: 'Name' });
  fireEvent.change(input, { target: { value: '  New name  ' } });
  expect(updateDocumentMaster).not.toHaveBeenCalled();
  fireEvent.blur(input);
  await waitFor(() => expect(input).toBeEnabled());
  expect(updateDocumentMaster).toHaveBeenCalledWith('rename-master', {
    name: 'New name', document: original.document, revision: 3, approved: true,
  });
  expect(input).toHaveValue('New name');
  fireEvent.blur(input);
  expect(updateDocumentMaster).toHaveBeenCalledTimes(1);
  fireEvent.focus(input);
  input.focus();
  fireEvent.change(input, { target: { value: 'Enter name' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  await waitFor(() => expect(updateDocumentMaster).toHaveBeenCalledTimes(2));
  expect(vi.mocked(updateDocumentMaster).mock.calls[1][1]).toEqual({
    name: 'Enter name', document: original.document, revision: 4, approved: true,
  });
});

it('shows the toolbar and paper skeleton while fetching a document, then mounts the editor', async () => {
  let complete!: (value: DocumentMasterDetail) => void;
  vi.mocked(getDocumentMaster).mockReturnValueOnce(new Promise((resolve) => { complete = resolve; }));
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={query}><DocumentMasterEditor id="loading-master" /></QueryClientProvider>
  );
  expect(screen.getByRole('status', { name: 'Word-Editor wird geladen' })).toBeInTheDocument();
  const paper = container.querySelector('.document-editor-paper');
  expect(paper).toHaveStyle({ width: '210mm', padding: '20mm 20mm 20mm 20mm' });
  expect(container.querySelector('.tiptap')).toBeNull();
  complete({
    id: 'loading-master', name: 'Loaded master', kind: 'employment_contract',
    isPrimary: true, updatedAt: '2026-10-17', revision: 1, approvedAt: null,
    text: '', segments: [], document: fromSegments([{ type: 'text', text: 'Loaded document' }]),
  });
  expect(await screen.findByDisplayValue('Loaded master')).toBeInTheDocument();
  await waitFor(() => expect(container.querySelector('.tiptap')).not.toBeNull());
  expect(screen.queryByRole('status', { name: 'Word-Editor wird geladen' })).not.toBeInTheDocument();
});
