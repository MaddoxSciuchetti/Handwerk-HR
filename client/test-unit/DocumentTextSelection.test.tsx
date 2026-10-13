import { act, render, screen } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import { closeHistory } from '@tiptap/pm/history';
import { expect, it, vi } from 'vitest';
import { StyledDocumentEditor } from '@/features/settings/documents/StyledDocumentEditor';
import { fromSegments } from '@/features/settings/documents/styledDocument';

const marks = [
  { type: 'bold' },
  { type: 'underline' },
  {
    type: 'textStyle',
    attrs: { color: '#b32145', fontFamily: 'Arial', fontSize: 12 },
  },
];
function fixture() {
  const value = fromSegments([]);
  value.content = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: { marginLeft: 24, lineHeight: 1.4, textAlign: 'center' },
        content: [{ type: 'text', text: 'Body, Wort!', marks }],
      },
      {
        type: 'lineGroup',
        attrs: {
          height: 20,
          marginTop: 8,
          lines: [
            { left: 0, top: 15, width: 250, thickness: 2, color: '#125599' },
          ],
          labels: [
            {
              text: 'Label, Wort!',
              left: 30,
              top: 0,
              color: '#125599',
              fontSize: 12,
              fontFamily: 'Arial',
              centered: true,
              bold: true,
              underline: true,
            },
          ],
        },
      },
      {
        type: 'table',
        attrs: { border: 'box', boxWidth: 320, marginLeft: 24 },
        content: [
          {
            type: 'tableRow',
            content: [
              {
                type: 'tableCell',
                attrs: { colwidth: [320] },
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Table, Wort!', marks }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  value.header = fromSegments([{ type: 'text', text: 'Header' }]).content;
  value.footer = fromSegments([{ type: 'text', text: 'Footer' }]).content;
  return value;
}

function formatting(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(formatting);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'text')
      .map(([key, child]) => [key, formatting(child)])
  );
}

it.each(['Body', 'Label', 'Table'])(
  'edits a letter and a whole word in %s text without changing colors, rules, boxes, or layout',
  async (prefix) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    const value = fixture();
    const onChange = vi.fn();
    render(
      <StyledDocumentEditor
        document={value}
        master
        pageView
        onChange={onChange}
      />
    );
    const target = await screen.findByText(`${prefix}, Wort!`);
    const editor = spy.mock.instances.at(-1) as Editor;
    // jsdom has no layout; let selection tests skip browser scrolling.
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        handleScrollToSelection: () => true,
      },
    });
    const original = editor.getJSON();
    const descriptor = Object.getOwnPropertyDescriptor(
      window.document,
      'caretPositionFromPoint'
    );
    let offset = `${prefix}, `.length + 2;
    Object.defineProperty(window.document, 'caretPositionFromPoint', {
      configurable: true,
      value: () => ({ offsetNode: target.firstChild!, offset }),
    });
    const coords = vi
      .spyOn(editor.view, 'posAtCoords')
      .mockReturnValue({ pos: 0, inside: 0 });
    const click = (double = false, shiftKey = false) => {
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        detail: double ? 2 : 1,
        shiftKey,
      });
      Object.defineProperty(event, 'target', { value: target });
      act(() => {
        editor.view.someProp(
          double ? 'handleDoubleClick' : 'handleClick',
          (handler) => handler(editor.view, 0, event)
        );
      });
      expect(event.defaultPrevented).toBe(true);
    };
    try {
      click();
      expect(editor.state.selection.$from.parentOffset).toBe(offset);
      expect(editor.state.selection.empty).toBe(true);
      act(() => {
        editor.view.dispatch(
          editor.state.tr.delete(
            editor.state.selection.from - 1,
            editor.state.selection.from
          )
        );
      });
      expect(target.textContent).toBe(`${prefix}, Wrt!`);
      expect(formatting(editor.getJSON())).toEqual(formatting(original));
      act(() => {
        editor.view.dispatch(closeHistory(editor.state.tr));
      });
      offset = `${prefix}, `.length + 1;
      click(true);
      expect(
        editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        )
      ).toBe('Wrt');
      act(() => {
        editor.view.dispatch(editor.state.tr.deleteSelection());
      });
      expect(target.textContent).toBe(`${prefix}, !`);
      expect(formatting(editor.getJSON())).toEqual(formatting(original));
      const published = onChange.mock.calls.at(-1)![0];
      expect(published.page).toEqual(value.page);
      expect(published.header).toEqual(value.header);
      expect(published.footer).toEqual(value.footer);
      expect(coords).not.toHaveBeenCalled();
      // Undo preserves both text and formatting after a selection deletion.
      act(() => {
        editor.commands.undo();
      });
      expect(formatting(editor.getJSON())).toEqual(formatting(original));
      expect(editor.state.doc.textContent).toContain(`${prefix}, Wrt!`);
      offset = `${prefix}, `.length;
      click();
      offset += 3;
      click(false, true);
      expect(
        editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        )
      ).toBe('Wrt');
    } finally {
      if (descriptor)
        Object.defineProperty(
          window.document,
          'caretPositionFromPoint',
          descriptor
        );
      else
        delete (
          window.document as Document & { caretPositionFromPoint?: unknown }
        ).caretPositionFromPoint;
      coords.mockRestore();
      spy.mockRestore();
    }
  }
);

it('keeps positioned label styles and decorative rule DOM stable while the text changes', async () => {
  const spy = vi.spyOn(Editor.prototype, 'setOptions');
  const { container } = render(
    <StyledDocumentEditor document={fixture()} master pageView />
  );
  const target = await screen.findByText('Label, Wort!');
  const label = target.closest('[data-line-label]')!;
  const editor = spy.mock.instances.at(-1) as Editor;
  const rule = container.querySelector(
    '[data-line-group] > div:first-child > span'
  );
  const observer = new MutationObserver(() => undefined);
  observer.observe(label, { attributes: true });
  const pos = editor.view.posAtDOM(target.firstChild!, 3);
  act(() => {
    editor.view.dispatch(editor.state.tr.insertText('X', pos));
  });
  expect(observer.takeRecords()).toHaveLength(0);
  expect(
    container.querySelector('[data-line-group] > div:first-child > span')
  ).toBe(rule);
  observer.disconnect();
  spy.mockRestore();
});
