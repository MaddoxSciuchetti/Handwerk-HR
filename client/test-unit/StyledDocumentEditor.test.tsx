import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import { PreparedPdfPreview } from '@/features/worker-task-management/components/files/PreparedPdfPreview';

const document = fromSegments([
  { type: 'text', text: 'Vertrag mit ' },
  { type: 'input', key: 'contract.vorname', label: 'Vorname' },
  { type: 'text', text: ' bestätigt: ' },
  {
    type: 'input',
    key: 'contract.accept',
    label: 'Bestätigung',
    fieldType: 'checkbox',
    required: false,
  },
]);
it('allows inline value and checkbox edits while locking the surrounding wording', async () => {
  const onValueChange = vi.fn();
  render(
    <StyledDocumentEditor
      document={document}
      values={{ 'contract.vorname': 'Ada' }}
      onValueChange={onValueChange}
    />
  );
  const input = await screen.findByRole('textbox', { name: 'Vorname' });
  await waitFor(() => expect(input).toHaveTextContent('Ada'));
  expect(input).toHaveAttribute('contenteditable', 'true');
  const prose = input.closest('.tiptap');
  expect(prose).toHaveAttribute('contenteditable', 'false');
  Object.defineProperty(input, 'innerText', {
    configurable: true,
    value: 'Jörg Müller',
  });
  fireEvent.input(input);
  expect(onValueChange).toHaveBeenCalledWith('contract.vorname', 'Jörg Müller');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Bestätigung' }));
  expect(onValueChange).toHaveBeenCalledWith('contract.accept', 'true');
});
it('keeps the returned signed-document view read-only', async () => {
  render(
    <StyledDocumentEditor
      document={document}
      values={{ 'contract.vorname': 'Ada' }}
      readOnly
    />
  );
  expect(
    await screen.findByRole('textbox', { name: 'Vorname' })
  ).toHaveAttribute('contenteditable', 'false');
  expect(screen.getByRole('checkbox', { name: 'Bestätigung' })).toBeDisabled();
});
it('shows the actual prepared PDF and requires an explicit approval', () => {
  const approve = vi.fn();
  render(
    <PreparedPdfPreview
      prepared={{
        id: 'pdf-1',
        previewUrl: 'https://signed.example/pdf-1',
        contentHash: 'hash',
        masterRevision: 1,
      }}
      approved={false}
      onApprove={approve}
    />
  );
  expect(screen.getByTitle('Finales PDF vor dem Versand')).toHaveAttribute(
    'src',
    'https://signed.example/pdf-1'
  );
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(approve).toHaveBeenCalledWith(true);
});
it('blocks approval for an uncertain provider outcome', () => {
  render(
    <PreparedPdfPreview
      prepared={{
        id: 'pdf-1',
        previewUrl: 'https://signed.example/pdf-1',
        contentHash: 'hash',
        masterRevision: 1,
        status: 'uncertain',
      }}
      approved={false}
      onApprove={vi.fn()}
    />
  );
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByText(/erneuter Versand ist gesperrt/)).toBeInTheDocument();
});
