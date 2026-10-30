import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { expect, it, vi } from 'vitest';
import { renderWithProviders } from './test-utils';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';

vi.mock('@/features/settings/documents/descriptionSentences.api', () => ({
  descriptionSentencesKey: ['documents', 'description-sentences'],
  getDescriptionSentences: vi.fn().mockResolvedValue([]),
  saveDescriptionSentence: vi.fn(),
}));

it.each([
  ['text', null],
  ['date', null],
  ['checkbox', null],
  ['checkbox', '□'],
  ['points', null],
] as const)(
  'removes only the clicked %s field (glyph %s) and supports undo',
  async (fieldType, glyph) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    try {
      const document = fromSegments([
        { type: 'text', text: 'Before ' },
        { type: 'input', key: 'contract.name', label: 'Name', fieldType },
        { type: 'text', text: ' After' },
        {
          type: 'input',
          key: 'contract.name',
          label: 'Other occurrence',
          fieldType,
        },
      ]);
      if (fieldType === 'points') {
        document.content.content = [
          { type: 'paragraph', content: [{ type: 'text', text: 'Before' }] },
          {
            type: 'descriptionPoints',
            attrs: { key: 'contract.name', label: 'Name' },
          },
          { type: 'paragraph', content: [{ type: 'text', text: 'After' }] },
          {
            type: 'descriptionPoints',
            attrs: { key: 'contract.name', label: 'Other occurrence' },
          },
        ];
      }
      if (glyph)
        document.content.content![0].content![1].attrs!.checkboxGlyph = glyph;
      const onChange = vi.fn();
      renderWithProviders(
        <StyledDocumentEditor document={document} master onChange={onChange} />
      );
      const remove = await screen.findByRole('button', {
        name: 'Name entfernen',
      });
      const editor = spy.mock.instances.at(-1) as Editor;
      fireEvent.mouseDown(remove);
      fireEvent.click(remove.querySelector('svg')!);
      await waitFor(() =>
        expect(
          screen.queryByRole('button', { name: 'Name entfernen' })
        ).toBeNull()
      );
      expect(
        screen.getByRole('button', { name: 'Other occurrence entfernen' })
      ).toBeInTheDocument();
      expect(editor.getText()).toContain('Before');
      expect(editor.getText()).toContain('After');
      expect(onChange).toHaveBeenCalled();
      act(() => {
        editor.commands.undo();
      });
      expect(
        await screen.findByRole('button', { name: 'Name entfernen' })
      ).toBeInTheDocument();
      expect(JSON.stringify(editor.getJSON())).not.toContain(
        'document-field-remove'
      );
    } finally {
      spy.mockRestore();
    }
  }
);

it('allows removal in a person-specific draft and hides removal in read-only documents', async () => {
  const document = fromSegments([
    { type: 'input', key: 'contract.name', label: 'Name' },
  ]);
  const { unmount } = renderWithProviders(
    <StyledDocumentEditor
      document={document}
      values={{ 'contract.name': 'Ada' }}
    />
  );
  fireEvent.click(
    await screen.findByRole('button', { name: 'Name entfernen' })
  );
  expect(screen.queryByRole('textbox', { name: 'Name' })).toBeNull();
  unmount();
  renderWithProviders(<StyledDocumentEditor document={document} readOnly />);
  await screen.findByRole('textbox', { name: 'Name' });
  expect(screen.queryByRole('button', { name: 'Name entfernen' })).toBeNull();
});
