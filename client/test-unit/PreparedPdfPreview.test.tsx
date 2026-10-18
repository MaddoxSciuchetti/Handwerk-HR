import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { PreparedPdfPreview } from '@/features/worker-task-management/components/files/PreparedPdfPreview';

it('keeps a paper skeleton until the current PDF frame loads, including after switching PDFs', () => {
  const prepared = {
    id: 'first',
    previewUrl: '/first.pdf',
    contentHash: 'hash',
    masterRevision: 1,
  };
  const view = render(
    <PreparedPdfPreview
      prepared={prepared}
      page={{ width: 297, height: 210 }}
    />
  );
  expect(
    screen.getByRole('status', { name: 'PDF wird geladen' })
  ).toBeInTheDocument();
  const frame = screen.getByTitle('Finales PDF vor dem Versand');
  expect(frame).toHaveStyle({ width: '297mm', height: '210mm' });
  expect(frame).toHaveAttribute('aria-busy', 'true');
  fireEvent.load(frame);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  view.rerender(
    <PreparedPdfPreview
      prepared={{ ...prepared, id: 'second', previewUrl: '/second.pdf' }}
    />
  );
  expect(
    screen.getByRole('status', { name: 'PDF wird geladen' })
  ).toBeInTheDocument();
  fireEvent.load(screen.getByTitle('Finales PDF vor dem Versand'));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
