import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, it, expect } from 'vitest';
import { DocumentPrintPreview } from '@/features/settings/documents/DocumentPrintPreview';
import { apiJson } from '@/config/apiClient';

const fixture = vi.hoisted(() => ({
  render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
  destroy: vi.fn(),
}));
vi.mock('@/config/apiClient', () => ({ apiJson: { get: vi.fn() } }));
vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: '/worker.js',
}));
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 2,
      destroy: fixture.destroy,
      getPage: async (number: number) => ({
        getViewport: ({ scale }: { scale: number }) => ({
          width: (number === 1 ? 595.28 : 841.89) * scale,
          height: (number === 1 ? 841.89 : 595.28) * scale,
        }),
        render: fixture.render,
      }),
    }),
  }),
}));
it('shows separate pages with PDF paper dimensions, and zooms without changing them', async () => {
  const blob = new Blob(['pdf']);
  Object.defineProperty(blob, 'arrayBuffer', {
    value: async () => new ArrayBuffer(3),
  });
  vi.mocked(apiJson.get).mockResolvedValue(blob);
  const query = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={query}>
      <DocumentPrintPreview id="master" revision={4} />
    </QueryClientProvider>
  );
  const first = await screen.findByLabelText('Druckseite 1');
  const second = screen.getByLabelText('Druckseite 2');
  expect(parseFloat(first.style.width)).toBeCloseTo(210, 1);
  expect(parseFloat(first.style.height)).toBeCloseTo(297, 1);
  expect(parseFloat(second.style.width)).toBeCloseTo(297, 1);
  expect(screen.getByLabelText('Seite 1')).toHaveClass('mb-8');
  expect(screen.getByText('Seite 2 von 2')).toBeInTheDocument();
  await waitFor(() => expect(fixture.render).toHaveBeenCalledTimes(2));
  fireEvent.change(screen.getByLabelText('Druckvorschau-Zoom'), {
    target: { value: '75' },
  });
  expect(parseFloat(first.style.width)).toBeCloseTo(210, 1);
  expect(apiJson.get).toHaveBeenCalledWith(
    '/document-masters/master/preview.pdf',
    { responseType: 'blob' }
  );
  view.unmount();
  expect(fixture.destroy).toHaveBeenCalled();
});
