import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { useState } from 'react';
import { Editor } from '@tiptap/core';
import { vi, it, expect } from 'vitest';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { StyledDocumentReview } from '@/features/settings/documents/StyledDocumentReview';
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
it('lets master review correct a list restart without changing field keys', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const value = fromSegments([
    { type: 'text', text: 'Clause ' },
    { type: 'input', key: 'contract.name', label: 'Name' },
  ]);
  value.content.content = [
    {
      type: 'orderedList',
      attrs: { start: 1 },
      content: [{ type: 'listItem', content: value.content.content }],
    },
  ];
  const onChange = vi.fn();
  render(<StyledDocumentEditor document={value} master onChange={onChange} />);
  await screen.findByText('Clause');
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  act(() => {
    editor.commands.setTextSelection(3);
  });
  fireEvent.change(
    await screen.findByRole('spinbutton', { name: 'Nummerierungsbeginn' }),
    { target: { value: '3' } }
  );
  expect(editor.getJSON().content?.[0].attrs?.start).toBe(3);
  expect(JSON.stringify(onChange.mock.calls.at(-1)?.[0])).toContain(
    'contract.name'
  );
  optionsSpy.mockRestore();
});
it('shows a checkbox as a box and reveals its stored key only when the field is clicked', async () => {
  render(<StyledDocumentEditor document={document} master />);
  const box = await screen.findByRole('checkbox', { name: 'Bestätigung' });
  expect(box).not.toHaveTextContent('Bestätigung');
  expect(screen.queryByText('contract.accept')).not.toBeInTheDocument();
  fireEvent.mouseDown(box);
  expect(await screen.findByText('contract.accept')).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByText('Vorname'));
  expect(await screen.findByText('contract.vorname')).toBeInTheDocument();
});
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

it('keeps cursor and controlled text stable across typing, deletion and parent echoes', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const onChange = vi.fn();
  function ControlledEditor() {
    const [value, setValue] = useState(
      fromSegments([
        { type: 'text', text: 'Alpha beta gamma\nSecond paragraph' },
      ])
    );
    return (
      <StyledDocumentEditor
        document={value}
        master
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
    );
  }
  render(<ControlledEditor />);
  await waitFor(() =>
    expect(screen.getByText('Alpha beta gamma')).toBeInTheDocument()
  );
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  expect(onChange).not.toHaveBeenCalled();
  act(() => {
    editor.commands.setTextSelection(5);
    editor.commands.insertContent('X');
  });
  expect(editor.state.selection.from).toBe(6);
  expect(editor.getText()).toContain('AlphXa beta gamma');
  expect(onChange).toHaveBeenCalledTimes(1);
  act(() => {
    editor.commands.setTextSelection({ from: 2, to: 4 });
    editor.commands.deleteSelection();
  });
  expect(editor.state.selection.from).toBe(2);
  expect(editor.getText()).toContain('AhXa beta gamma');
  expect(onChange).toHaveBeenCalledTimes(2);
  act(() => {
    editor.commands.undo();
  });
  expect(editor.getText()).toContain('AlphXa beta gamma');
  optionsSpy.mockRestore();
});

it('does not publish content when switching editability or applying external content', async () => {
  const onChange = vi.fn();
  const initial = fromSegments([{ type: 'text', text: 'Initial content' }]);
  const { rerender } = render(
    <StyledDocumentEditor
      document={initial}
      master
      readOnly
      onChange={onChange}
    />
  );
  await screen.findByText('Initial content');
  rerender(
    <StyledDocumentEditor document={initial} master onChange={onChange} />
  );
  expect(onChange).not.toHaveBeenCalled();
  const external = fromSegments([{ type: 'text', text: 'External content' }]);
  rerender(
    <StyledDocumentEditor document={external} master onChange={onChange} />
  );
  expect(await screen.findByText('External content')).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});

it('zooms only the viewing canvas and retains import metadata while correcting existing alignment', async () => {
  const value = fromSegments([{ type: 'text', text: 'Imported paragraph' }]);
  value.content.content![0].attrs = { x: 50, textAlign: 'center' };
  const onChange = vi.fn();
  const { container } = render(
    <StyledDocumentEditor
      document={value}
      master
      pageView
      onChange={onChange}
    />
  );
  await screen.findByText('Imported paragraph');
  fireEvent.change(screen.getByRole('combobox', { name: 'Dokumentzoom' }), {
    target: { value: '175' },
  });
  expect(container.querySelector('.document-editor-paper')).toHaveStyle({
    zoom: '1.75',
    width: '210mm',
  });
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Formatierung und Felder'));
  fireEvent.click(screen.getByRole('button', { name: 'Alles linksbündig' }));
  const changed = onChange.mock.calls.at(-1)![0];
  expect(changed.content.content[0].attrs.textAlign).toBe('left');
  expect(changed.content.content[0].attrs.x).toBe(50);
  expect(changed.page).toEqual(value.page);
});

it('corrects long centered prose without changing short centered headings or field keys', async () => {
  const value = fromSegments([
    {
      type: 'text',
      text:
        'Arbeitsvertrag\n' +
        'Dies ist ein längerer Absatz im Arbeitsvertrag. '.repeat(5),
    },
    { type: 'input', key: 'contract.vorname', label: 'Vorname' },
  ]);
  value.content.content!.forEach((paragraph) => {
    paragraph.attrs = { textAlign: 'center' };
  });
  const onChange = vi.fn();
  render(<StyledDocumentEditor document={value} master onChange={onChange} />);
  await screen.findByText('Arbeitsvertrag');
  fireEvent.click(
    screen.getByRole('button', { name: 'Fließtext linksbündig' })
  );
  const result = onChange.mock.calls.at(-1)![0];
  expect(result.content.content[0].attrs.textAlign).toBe('center');
  expect(result.content.content[1].attrs.textAlign).toBe('left');
  expect(result.content.content[1].content.at(-1).attrs.key).toBe(
    'contract.vorname'
  );
});

it('retains centered labels, salary sizing and dynamic page fields when edited', async () => {
  const value = fromSegments([]);
  value.content = {
    type: 'doc',
    content: [
      {
        type: 'lineGroup',
        attrs: {
          lines: [],
          height: 16,
          labels: [
            {
              text: 'BSB GmbH',
              left: 240,
              top: 0,
              fontSize: 10,
              color: '#000000',
              centered: true,
              underline: true,
            },
          ],
        },
      },
      {
        type: 'table',
        attrs: { border: 'box', boxWidth: 460, marginLeft: 24 },
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colwidth: [460] },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Lohn' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'paragraph',
        attrs: { textAlign: 'right' },
        content: [
          { type: 'text', text: 'Seite ' },
          { type: 'pageField', attrs: { kind: 'page' } },
          { type: 'text', text: ' von ' },
          { type: 'pageField', attrs: { kind: 'pages' } },
        ],
      },
    ],
  };
  const onChange = vi.fn();
  const { container } = render(
    <StyledDocumentEditor document={value} master onChange={onChange} />
  );
  expect(await screen.findByText('BSB GmbH')).toHaveStyle({
    transform: 'translateX(-50%)',
  });
  expect(container.querySelector('table')).toHaveAttribute(
    'data-border',
    'box'
  );
  expect(container.querySelector('table')).toHaveStyle({ marginLeft: '24pt' });
  expect(
    container.querySelector('[data-page-field="pages"]')
  ).toHaveTextContent('‹Seiten›');
  fireEvent.click(screen.getByText('Formatierung und Felder'));
  fireEvent.click(screen.getByRole('button', { name: 'Alles linksbündig' }));
  const updated = onChange.mock.calls.at(-1)![0];
  expect(
    updated.content.content.find(
      (node: { type: string }) => node.type === 'lineGroup'
    ).attrs.labels[0].centered
  ).toBe(true);
  expect(
    updated.content.content.find(
      (node: { type: string }) => node.type === 'table'
    ).attrs
  ).toMatchObject({ border: 'box', boxWidth: 460, marginLeft: 24 });
});

it('lets a positioned line label be edited after Bearbeiten', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const onChange = vi.fn();
  const value = fromSegments([]);
  value.content = {
    type: 'doc',
    content: [
      {
        type: 'lineGroup',
        attrs: {
          height: 16,
          lines: [],
          labels: [
            {
              text: 'BSB Haustechnik GmbH',
              left: 20,
              top: 0,
              fontSize: 10,
              color: '#000000',
            },
          ],
        },
      },
    ],
  };
  render(<StyledDocumentEditor document={value} master onChange={onChange} />);
  const label = await screen.findByText('BSB Haustechnik GmbH');
  expect(label.closest('.tiptap')).toHaveAttribute('contenteditable', 'true');
  expect(label).toHaveStyle({ outline: 'none' });
  expect(label.closest('[data-line-group]')).not.toHaveClass(
    'ProseMirror-selectednode'
  );
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  let textPos = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === 'BSB Haustechnik GmbH') textPos = pos;
  });
  act(() => {
    editor
      .chain()
      .setTextSelection(textPos + 3)
      .command(({ tr }) => {
        tr.insertText('X');
        return true;
      })
      .run();
  });
  expect(screen.getByText('BSBX Haustechnik GmbH')).toBeTruthy();
  const updated = onChange.mock.calls.at(-1)![0];
  expect(updated.content.content[0].content[0].content[0].text).toBe(
    'BSBX Haustechnik GmbH'
  );
  optionsSpy.mockRestore();
});

it('reviews a contract as separate pages with the letterhead on the sheet', async () => {
  const value = fromSegments([{ type: 'text', text: 'Vertragsseite' }]);
  value.header = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Briefkopf' }],
      },
    ],
  };
  value.footer = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Fußzeile Seite ‹Seite› von ‹Seiten›' }],
      },
    ],
  };
  const { container } = render(
    <StyledDocumentReview
      document={value}
      values={{}}
      onValueChange={() => undefined}
      readOnly
    />
  );
  expect(await screen.findByText('Vertragsseite')).toBeInTheDocument();
  const sheet = screen.getByLabelText('Editorseite 1');
  expect(sheet).toHaveTextContent('Briefkopf');
  expect(sheet).toHaveTextContent('Fußzeile Seite 1 von 1');
  expect(container.querySelectorAll('.tiptap')).toHaveLength(1);
  expect(container.querySelector('.document-editor-paper')).toHaveStyle({
    zoom: '1',
  });
  expect(
    screen.queryByText('Ansichtszoom – verändert nicht das PDF')
  ).not.toBeInTheDocument();
});
