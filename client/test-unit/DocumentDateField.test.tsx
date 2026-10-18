import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import { afterEach, expect, it, vi } from 'vitest';
import { currentDocumentDate, fromSegments } from '@shared/document';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';

afterEach(() => vi.restoreAllMocks());

it('adds an automatic date and lets the user change it later through field details', async () => {
  const spy = vi.spyOn(Editor.prototype, 'setOptions');
  const user = userEvent.setup();
  render(
    <StyledDocumentEditor
      document={fromSegments([{ type: 'text', text: 'Datum' }])}
      master
    />
  );
  await screen.findByText('Datum');
  const editor = spy.mock.instances.at(-1) as Editor;
  editor.setOptions({
    editorProps: {
      ...editor.options.editorProps,
      handleScrollToSelection: () => true,
    },
  });
  act(() => editor.commands.setTextSelection({ from: 1, to: 6 }));
  await user.type(screen.getByLabelText('Feldbezeichnung'), 'Vertragsdatum');
  await user.click(screen.getByRole('combobox', { name: 'Feldtyp' }));
  await user.click(await screen.findByRole('option', { name: 'Datum' }));
  await user.click(
    screen.getByRole('checkbox', { name: 'Immer aktuelles Datum verwenden' })
  );
  await user.click(screen.getByRole('button', { name: 'Feld einsetzen' }));
  expect(editor.state.doc.firstChild!.firstChild!.attrs).toMatchObject({
    fieldType: 'date',
    dateMode: 'today',
  });
  await user.click(await screen.findByText('Vertragsdatum (heute)'));
  const settings = screen.getByRole('dialog');
  const toggle = within(settings).getByRole('checkbox', {
    name: 'Immer aktuelles Datum verwenden',
  });
  expect(toggle).toBeChecked();
  await user.click(toggle);
  expect(editor.state.doc.firstChild!.firstChild!.attrs!.dateMode).toBeNull();
});

it('shows today instead of an old draft date and keeps automatic fields read-only', async () => {
  const document = fromSegments([
    {
      type: 'input',
      key: 'contract.today',
      label: 'Vertragsdatum',
      fieldType: 'date',
      dateMode: 'today',
    },
  ]);
  render(
    <StyledDocumentEditor
      document={document}
      values={{ 'contract.today': '2000-01-01' }}
    />
  );
  const date = await screen.findByLabelText('Vertragsdatum');
  expect(date).toHaveValue(currentDocumentDate());
  expect(date).toHaveAttribute('readonly');
});

it('preserves the recorded date when viewing a finalized document', async () => {
  const document = fromSegments([
    {
      type: 'input',
      key: 'contract.today',
      label: 'Vertragsdatum',
      fieldType: 'date',
      dateMode: 'today',
    },
  ]);
  render(
    <StyledDocumentEditor
      document={document}
      values={{ 'contract.today': '2026-01-15' }}
      readOnly
    />
  );
  expect(await screen.findByLabelText('Vertragsdatum')).toHaveValue(
    '2026-01-15'
  );
});
