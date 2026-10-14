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
  fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
  time.mockReturnValue(1000);
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
});
