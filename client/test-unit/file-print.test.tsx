import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FileText } from 'lucide-react';
import { StoredFileBox } from '@/features/worker-task-management/components/files/StoredFileBox';
import { printStoredFile } from '@/features/worker-task-management/printStoredFile';
import { printPdfBlob } from '@/features/worker-task-management/printPdf';
import { toast } from 'sonner';

vi.mock('@/features/worker-task-management/printPdf', () => ({
  printPdfBlob: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('prints from the file card without opening the editor or a download link', async () => {
  const blob = new Blob(['%PDF'], { type: 'application/pdf' });
  const fetch = vi.fn().mockResolvedValue({ ok: true, blob: async () => blob });
  vi.stubGlobal('fetch', fetch);
  const onOpen = vi.fn();
  render(
    <StoredFileBox
      label="Vertrag.pdf"
      icon={FileText}
      onOpen={onOpen}
      onPrint={() =>
        printStoredFile('https://storage.test/file', 'Vertrag.pdf')
      }
    />
  );
  const button = screen.getByRole('button', { name: 'Vertrag.pdf drucken' });
  expect(button).toHaveClass(
    'group-hover:opacity-100',
    'group-focus-within:opacity-100'
  );
  fireEvent.click(button);
  await waitFor(() => expect(printPdfBlob).toHaveBeenCalledOnce());
  expect(fetch).toHaveBeenCalledWith('https://storage.test/file');
  expect(vi.mocked(printPdfBlob).mock.calls[0][0].type).toBe('application/pdf');
  expect(onOpen).not.toHaveBeenCalled();
  expect(document.querySelector('a[download]')).toBeNull();
});

it('keeps the create-from-template card free of print actions', () => {
  render(
    <StoredFileBox label="Aus Vorlage" icon={FileText} onOpen={vi.fn()} />
  );
  expect(screen.queryByRole('button', { name: /drucken/ })).toBeNull();
});

it('reports loading failures and makes printing available again', async () => {
  render(
    <StoredFileBox
      label="Datei"
      icon={FileText}
      onOpen={vi.fn()}
      onPrint={async () => {
        throw new Error('Laden fehlgeschlagen');
      }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Datei drucken' }));
  await waitFor(() =>
    expect(toast.error).toHaveBeenCalledWith('Laden fehlgeschlagen')
  );
  expect(screen.getByRole('button', { name: 'Datei drucken' })).toBeEnabled();
});

it('does not send unsupported file types to the browser print viewer', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['word'], { type: 'application/msword' }),
      })
  );
  await expect(
    printStoredFile('https://storage.test/file', 'Vertrag.doc')
  ).rejects.toThrow('Dieser Dateityp');
  expect(printPdfBlob).not.toHaveBeenCalled();
});
