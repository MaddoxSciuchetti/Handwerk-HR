import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { useState } from 'react';
import { renderWithProviders } from 'test-unit/test-utils';
import userEvent from '@testing-library/user-event';
import { Editor } from '@tiptap/core';
import { vi, it, expect } from 'vitest';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { StyledDocumentReview } from '@/features/settings/documents/StyledDocumentReview';
import { fromSegments } from '@/features/settings/documents/styledDocument';
import { PreparedPdfPreview } from '@/features/worker-task-management/components/files/PreparedPdfPreview';

vi.mock('@/features/settings/documents/descriptionSentences.api', () => ({
  descriptionSentencesKey: ['documents', 'description-sentences'],
  getDescriptionSentences: vi.fn().mockResolvedValue([]),
  saveDescriptionSentence: vi.fn(),
}));

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
    'https://signed.example/pdf-1#view=FitH&zoom=page-width&toolbar=1&navpanes=0&scrollbar=1'
  );
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  fireEvent.click(screen.getByRole('checkbox'));
  expect(approve).toHaveBeenCalledWith(true);
});
it('shows the prepared PDF at the same page size as the Word preview', () => {
  render(
    <PreparedPdfPreview
      prepared={{
        id: 'pdf-1',
        previewUrl: 'https://signed.example/pdf-1',
        contentHash: 'hash',
        masterRevision: 1,
      }}
      approved={false}
      onApprove={vi.fn()}
      page={{ width: 210, height: 297 }}
    />
  );
  const frame = screen.getByTitle('Finales PDF vor dem Versand');
  expect(frame).toHaveStyle({ width: '210mm', height: '297mm' });
  expect(frame).toHaveAttribute(
    'src',
    'https://signed.example/pdf-1#view=FitH&zoom=page-width&toolbar=0&navpanes=0&scrollbar=1'
  );
  expect(frame.parentElement?.parentElement).not.toHaveClass('max-w-3xl');
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
    editor.view.dispatch(editor.state.tr.deleteSelection());
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

it('lets the sender type Tätigkeitspunkte without a stored field value', async () => {
  const value = fromSegments([{ type: 'text', text: 'Aufgaben' }]);
  value.content.content!.push({
    type: 'descriptionPoints',
    attrs: {
      key: 'contract.taetigkeiten',
      label: 'Tätigkeiten',
      fieldType: 'points',
      required: true,
    },
  });
  const onValueChange = vi.fn();
  renderWithProviders(
    <StyledDocumentReview
      document={value}
      values={{ 'contract.taetigkeiten': 'Montage' }}
      onValueChange={onValueChange}
      readOnly={false}
    />
  );
  expect(
    await screen.findByText(
      'Satz auswählen oder eigenen Text eingeben. Tab für Vorschläge, Enter zum Auswählen oder Hinzufügen.'
    )
  ).toBeTruthy();
  const point = await screen.findByRole('combobox', { name: 'Tätigkeiten 1' });
  expect(point).toHaveValue('Montage');
  fireEvent.change(point, { target: { value: 'Wartung' } });
  expect(onValueChange).toHaveBeenCalledWith('contract.taetigkeiten', 'Wartung');
  fireEvent.paste(point, {
    clipboardData: { getData: () => 'Montage\nWartung' },
  });
  expect(onValueChange).toHaveBeenCalledWith(
    'contract.taetigkeiten',
    'Montage\nWartung'
  );
  fireEvent.click(screen.getByRole('button', { name: 'Punkt hinzufügen' }));
  expect(onValueChange).toHaveBeenCalledWith(
    'contract.taetigkeiten',
    'Montage\n'
  );
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
        content: [
          { type: 'text', text: 'Fußzeile Seite ‹Seite› von ‹Seiten›' },
        ],
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

it('places a caret inside positioned text even when coordinate lookup finds the group boundary', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
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
            { text: 'BSB Haustechnik GmbH', left: 20, top: 0, fontSize: 10 },
          ],
        },
      },
    ],
  };
  render(<StyledDocumentEditor document={value} master pageView />);
  const label = await screen.findByText('BSB Haustechnik GmbH');
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  const range = window.document.createRange();
  range.setStart(label.firstChild!, 7);
  range.collapse(true);
  const original = Object.getOwnPropertyDescriptor(
    window.document,
    'caretRangeFromPoint'
  );
  Object.defineProperty(window.document, 'caretRangeFromPoint', {
    configurable: true,
    value: () => range,
  });
  const coords = vi
    .spyOn(editor.view, 'posAtCoords')
    .mockReturnValue({ pos: 0, inside: 0 });
  const click = (detail: number) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      detail,
    });
    Object.defineProperty(event, 'target', { value: label });
    act(() => {
      editor.view.someProp(
        detail > 1 ? 'handleDoubleClick' : 'handleClick',
        (handler) => handler(editor.view, 0, event)
      );
    });
    return event;
  };
  try {
    expect(click(1).defaultPrevented).toBe(true);
    expect(editor.state.selection.$from.parentOffset).toBe(7);
    expect(editor.state.selection.empty).toBe(true);
    expect(coords).not.toHaveBeenCalled();
    act(() => {
      editor.commands.deleteRange({
        from: editor.state.selection.from - 1,
        to: editor.state.selection.from,
      });
    });
    expect(label).toHaveTextContent('BSB Hastechnik GmbH');
    range.setStart(label.firstChild!, 6);
    range.collapse(true);
    click(2);
    expect(
      editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to
      )
    ).toBe('Hastechnik');
    act(() => {
      editor.view.dispatch(editor.state.tr.deleteSelection());
    });
    expect(label).toHaveTextContent('BSB GmbH');
  } finally {
    if (original)
      Object.defineProperty(window.document, 'caretRangeFromPoint', original);
    else
      delete (window.document as Document & { caretRangeFromPoint?: unknown })
        .caretRangeFromPoint;
    coords.mockRestore();
    optionsSpy.mockRestore();
  }
});

it('keeps imported 8pt runs below a 14pt checkbox from expanding over an adjacent tab label', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const value = fromSegments([]);
  value.content = {
    type: 'doc',
    content: [
      {
        type: 'lineGroup',
        attrs: {
          height: 20,
          lines: [],
          labels: [
            {
              left: 0,
              top: 0,
              fontFamily: 'Arial',
              fontSize: 14,
              text: '☐ in einem befristeten Arbeitsverhältnis',
              runs: [
                { text: '☐', props: { fontFamily: 'Arial', fontSize: 14 } },
                {
                  text: ' in einem ',
                  props: { fontFamily: 'Arial', fontSize: 8, color: '#000000' },
                },
                {
                  text: 'befristeten Arbeitsverhältnis',
                  props: { fontFamily: 'Arial', fontSize: 8, bold: true },
                },
              ],
            },
            {
              left: 369.35,
              top: 0,
              fontFamily: 'Arial',
              fontSize: 8,
              text: 'bis zum ',
              runs: [
                {
                  text: 'bis zum ',
                  props: { fontFamily: 'Arial', fontSize: 8 },
                },
              ],
            },
          ],
        },
      },
    ],
  };
  const onChange = vi.fn();
  const { container } = render(
    <StyledDocumentEditor
      document={value}
      master
      pageView
      onChange={onChange}
    />
  );
  const caption = await screen.findByText('befristeten Arbeitsverhältnis');
  expect(caption.closest('span')!.style.fontSize).toBe('8pt');
  expect(screen.getByText('☐').closest('span')!.style.fontSize).toBe('14pt');
  expect(screen.getByText('bis zum').closest('span')!.style.fontSize).toBe(
    '8pt'
  );
  expect(container.innerHTML).not.toContain('ptpt');
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  let textPos = 0;
  editor.state.doc.descendants((node, pos) => {
    if (node.isText && node.text === 'befristeten Arbeitsverhältnis')
      textPos = pos;
  });
  act(() => {
    editor.view.dispatch(editor.state.tr.delete(textPos, textPos + 1));
  });
  const published = onChange.mock.calls.at(-1)![0];
  const first = published.content.content[0].content[0];
  expect(
    first.content
      .flatMap(
        (run: { marks?: { type: string; attrs?: { fontSize?: unknown } }[] }) =>
          run.marks ?? []
      )
      .filter((mark: { type: string }) => mark.type === 'textStyle')
      .map((mark: { attrs: { fontSize: unknown } }) => mark.attrs.fontSize)
  ).toEqual([14, 8, 8]);
  expect(published.content.content[0].attrs.labels[1].left).toBe(369.35);
  optionsSpy.mockRestore();
});

it.each(['□', '☐', '☒', '☑'])(
  'replaces imported %s with a keyed checkbox without changing its marks or neighboring text',
  async (glyph) => {
    const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
    const value = fromSegments([]);
    value.content.content = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: glyph,
            marks: [
              {
                type: 'textStyle',
                attrs: { fontFamily: 'Arial', fontSize: 14, color: '#215e99' },
              },
            ],
          },
          {
            type: 'text',
            text: ' Fixed term',
            marks: [{ type: 'textStyle', attrs: { fontSize: 8 } }],
          },
        ],
      },
    ];
    render(<StyledDocumentEditor document={value} master onChange={vi.fn()} />);
    await screen.findByText('Fixed term');
    const editor = optionsSpy.mock.instances.at(-1) as Editor;
    vi.spyOn(editor.view, 'scrollToSelection').mockImplementation(
      () => undefined
    );
    const originalMarks = editor.getJSON().content![0].content![0].marks;
    act(() => editor.commands.setTextSelection({ from: 1, to: 2 }));
    fireEvent.change(screen.getByLabelText('Feldbezeichnung'), {
      target: { value: 'Fixed term' },
    });
    fireEvent.change(screen.getByLabelText('Feldschlüssel'), {
      target: { value: 'contract.fixed_term' },
    });
    fireEvent.click(screen.getByLabelText('Feldtyp'));
    fireEvent.click(await screen.findByRole('option', { name: 'Kontrollkästchen' }));
    fireEvent.click(screen.getByRole('button', { name: 'Feld einsetzen' }));
    const nodes = editor.getJSON().content![0].content!;
    expect(nodes[0].attrs).toMatchObject({
      key: 'contract.fixed_term',
      fieldType: 'checkbox',
      checkboxGlyph: glyph,
      required: false,
    });
    expect(nodes[0].marks).toEqual(originalMarks);
    expect(nodes[1].text).toBe(' Fixed term');
    await waitFor(() =>
      expect(
        screen.getByTitle('Fixed term (contract.fixed_term)')
      ).toHaveTextContent(glyph)
    );
    optionsSpy.mockRestore();
  }
);

it('uses mapped checkbox values with the same glyph footprint and supports read-only viewing', async () => {
  const value = fromSegments([
    {
      type: 'input',
      key: 'contract.fixed_term',
      label: 'Fixed term',
      fieldType: 'checkbox',
      required: false,
    },
  ]);
  value.content.content![0].content![0].attrs!.checkboxGlyph = '□';
  const onValueChange = vi.fn();
  const { rerender } = render(
    <StyledDocumentEditor
      document={value}
      values={{ 'contract.fixed_term': 'false' }}
      onValueChange={onValueChange}
    />
  );
  const checkbox = await screen.findByRole('checkbox', { name: 'Fixed term' });
  expect(checkbox).not.toBeChecked();
  expect(checkbox.parentElement).toHaveTextContent('□');
  fireEvent.click(checkbox);
  expect(onValueChange).toHaveBeenCalledWith('contract.fixed_term', 'true');
  rerender(
    <StyledDocumentEditor
      document={value}
      values={{ 'contract.fixed_term': 'true' }}
      readOnly
    />
  );
  await waitFor(() => expect(checkbox).toBeChecked());
  expect(checkbox).toBeDisabled();
  expect(checkbox.parentElement!.querySelector('span')).toHaveStyle({
    visibility: 'visible',
  });
  expect(checkbox.parentElement).toHaveTextContent('□×');
});

it('moves positioned contract text and following content down when Enter splits a line', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const value = fromSegments([]);
  value.content = { type: 'doc', content: [
    { type: 'lineGroup', attrs: { height: 30, lines: [{ left: 0, top: 20, width: 50 }], labels: [] }, content: [
      { type: 'lineLabel', attrs: { top: 0, left: 10, fontSize: 10 }, content: [{ type: 'text', text: 'Contract clause' }] },
      { type: 'lineLabel', attrs: { top: 18, left: 10, fontSize: 10 }, content: [{ type: 'text', text: 'Following line' }] },
    ] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Next paragraph' }] },
  ] };
  render(<StyledDocumentEditor document={value} master />);
  await screen.findByText('Contract clause');
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  act(() => { editor.commands.setTextSelection(2); });
  fireEvent.keyDown(editor.view.dom, { key: 'Enter', code: 'Enter' });
  const group = editor.getJSON().content![0];
  expect(group.content![0].content ?? []).toHaveLength(0);
  expect(group.content![1].attrs!.top).toBe(12);
  expect(group.content![2].attrs!.top).toBe(30);
  expect(group.attrs!.height).toBe(42);
  expect(group.attrs!.lines[0].top).toBe(32);
  expect(editor.state.selection.$from.parent.textContent).toBe('Contract clause');
  optionsSpy.mockRestore();
});


it('retains the highlighted replacement text while entering a new field and changing its type', async () => {
  const optionsSpy = vi.spyOn(Editor.prototype, 'setOptions');
  const user = userEvent.setup();
  const value = fromSegments([{ type: 'text', text: 'Before replace me after' }]);
  const { container } = render(<StyledDocumentEditor document={value} master />);
  await screen.findByText('Before replace me after');
  const editor = optionsSpy.mock.instances.at(-1) as Editor;
  vi.spyOn(editor.view, 'scrollToSelection').mockImplementation(() => undefined);
  act(() => {
    editor.commands.focus();
    editor.commands.setTextSelection({ from: 8, to: 18 });
  });
  const label = screen.getByRole('textbox', { name: 'Feldbezeichnung' });
  await user.click(label);
  await user.type(label, 'Vorname');
  expect(editor.view.hasFocus()).toBe(false);
  expect(container.querySelector('.tiptap')).not.toHaveClass('ProseMirror-focused');
  expect(container.querySelector('.document-retained-selection')).toHaveTextContent('replace me');
  expect(editor.state.selection.from).toBe(8);
  expect(editor.state.selection.to).toBe(18);
  await user.type(screen.getByRole('textbox', { name: 'Feldschlüssel' }), 'contract.first_name');
  await user.click(screen.getByRole('combobox', { name: 'Feldtyp' }));
  await user.click(await screen.findByRole('option', { name: 'Datum' }));
  expect(container.querySelector('.document-retained-selection')).toHaveTextContent('replace me');
  await user.click(screen.getByRole('button', { name: 'Feld einsetzen' }));
  const nodes = editor.getJSON().content![0].content!;
  expect(nodes[0].text).toBe('Before ');
  expect(nodes[1]).toMatchObject({ type: 'documentField', attrs: { key: 'contract.first_name', label: 'Vorname', fieldType: 'date' } });
  expect(nodes[2].text).toBe(' after');
  expect(container.querySelector('.document-retained-selection')).toBeNull();
  expect(JSON.stringify(editor.getJSON())).not.toContain('document-retained-selection');
  act(() => editor.commands.undo());
  expect(editor.getText()).toBe('Before replace me after');
  act(() => editor.commands.setTextSelection(1));
  expect(container.querySelector('.document-retained-selection')).toBeNull();
  optionsSpy.mockRestore();
});
