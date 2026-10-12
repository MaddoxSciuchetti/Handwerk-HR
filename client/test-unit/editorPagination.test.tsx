import { render, screen, waitFor } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import { paginateBlocks } from '@/features/settings/documents/editorPagination';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';

it('keeps content within paper margins and handles explicit page breaks', () => {
  const result = paginateBlocks(
    [
      { pos: 0, top: 0, height: 70 },
      { pos: 20, top: 70, height: 40 },
      { pos: 40, top: 110, height: 0, break: true },
      { pos: 41, top: 110, height: 20 },
    ],
    100,
    140
  );
  expect(result).toEqual({
    gaps: [
      { pos: 20, height: 70 },
      { pos: 40, height: 100 },
    ],
    pages: 3,
  });
});
it('renders separate editable sheets without publishing pagination into the document', async () => {
  const document = fromSegments([{ type: 'text', text: 'First page' }]);
  document.content.content!.push(
    { type: 'pageBreak' },
    { type: 'paragraph', content: [{ type: 'text', text: 'Second page' }] }
  );
  const onChange = vi.fn();
  const { container } = render(
    <StyledDocumentEditor
      document={document}
      master
      pageView
      onChange={onChange}
    />
  );
  await screen.findByLabelText('Editorseite 2');
  await waitFor(() =>
    expect(
      container.querySelector('[data-editor-page-gap]')
    ).toBeInTheDocument()
  );
  expect(container.querySelector('.tiptap')).toHaveAttribute(
    'contenteditable',
    'true'
  );
  expect(onChange).not.toHaveBeenCalled();
  expect(document.content.content).toHaveLength(3);
});
