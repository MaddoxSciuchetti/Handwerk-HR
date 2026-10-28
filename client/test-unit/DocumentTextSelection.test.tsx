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

it.each([
  ['Body', 3, 4],
  ['Body', 4, 3],
  ['Label', 3, 4],
  ['Label', 4, 3],
  ['Table', 3, 4],
  ['Table', 4, 3],
])(
  'preserves a short native drag in %s, including its direction (%i → %i)',
  async (prefix, anchor, head) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    const onChange = vi.fn();
    const { container } = render(
      <StyledDocumentEditor
        document={fixture()}
        master
        pageView
        onChange={onChange}
      />
    );
    const target = await screen.findByText(`${prefix}, Wort!`);
    const editor = spy.mock.instances.at(-1) as Editor;
    const rule = container.querySelector(
      '[data-line-group] > div:first-child > span'
    );
    const text = target.firstChild!;
    const expectedAnchor = editor.view.posAtDOM(text, Number(anchor));
    const expectedHead = editor.view.posAtDOM(text, Number(head));
    const coords = vi
      .spyOn(editor.view, 'posAtCoords')
      .mockReturnValue({ pos: 0, inside: 0 });
    try {
      act(() => {
        editor.view.focus();
      });
      onChange.mockClear();
      act(() => {
        editor.view.someProp('handleDOMEvents', (handlers) =>
          handlers.mousedown?.(
            editor.view,
            new MouseEvent('mousedown', { clientX: 10, clientY: 10 })
          )
        );
        window
          .getSelection()!
          .setBaseAndExtent(text, Number(anchor), text, Number(head));
        const event = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          detail: 1,
          clientX: 11,
          clientY: 10,
        });
        Object.defineProperty(event, 'target', { value: target });
        editor.view.someProp('handleClick', (handler) =>
          handler(editor.view, 0, event)
        );
      });
      expect(editor.state.selection.anchor).toBe(expectedAnchor);
      expect(editor.state.selection.head).toBe(expectedHead);
      expect(editor.state.selection.empty).toBe(false);
      expect(coords).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(
        container.querySelector('[data-line-group] > div:first-child > span')
      ).toBe(rule);
    } finally {
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

it.each([
  ['Body', 0, 1],
  ['Label', 0, 1],
  ['Table', 0, 1],
  ['Body', 1, 1],
  ['Label', 1, 1],
  ['Table', 1, 1],
  ['Body', 0, 2],
  ['Label', 0, 2],
  ['Table', 0, 2],
])(
  'replaces an old highlight on a new %s click (movement %i, detail %i)',
  async (prefix, movement, detail) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    render(<StyledDocumentEditor document={fixture()} master pageView />);
    const target = await screen.findByText(`${prefix}, Wort!`);
    const editor = spy.mock.instances.at(-1) as Editor;
    const text = target.firstChild!;
    const descriptor = Object.getOwnPropertyDescriptor(
      window.document,
      'caretPositionFromPoint'
    );
    const offset = `${prefix}, `.length + 2;
    Object.defineProperty(window.document, 'caretPositionFromPoint', {
      configurable: true,
      value: () => ({ offsetNode: text, offset }),
    });
    try {
      act(() => {
        editor.view.focus();
        editor.commands.setTextSelection({
          from: editor.view.posAtDOM(text, 0),
          to: editor.view.posAtDOM(text, String(prefix).length),
        });
      });
      expect(window.getSelection()!.toString()).toBe(prefix);
      act(() => {
        editor.view.someProp('handleDOMEvents', (handlers) =>
          handlers.mousedown?.(
            editor.view,
            new MouseEvent('mousedown', { clientX: 20, clientY: 20 })
          )
        );
        const event = new MouseEvent('mouseup', {
          bubbles: true,
          cancelable: true,
          clientX: 20 + Number(movement),
          clientY: 20,
          detail: Number(detail),
        });
        Object.defineProperty(event, 'target', { value: target });
        editor.view.someProp(
          Number(detail) === 2 ? 'handleDoubleClick' : 'handleClick',
          (handler) => handler(editor.view, 0, event)
        );
      });
      if (Number(detail) === 1) {
        expect(editor.state.selection.empty).toBe(true);
        expect(editor.state.selection.$from.parentOffset).toBe(offset);
        expect(window.getSelection()!.isCollapsed).toBe(true);
      } else {
        expect(window.getSelection()!.toString()).toBe('Wort');
      }
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
      spy.mockRestore();
    }
  }
);

it.each(['Body', 'Label', 'Table'])(
  'supports dragging and Option word selection next to a field in %s',
  async (prefix) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    const onChange = vi.fn();
    render(
      <StyledDocumentEditor document={fixture()} master onChange={onChange} />
    );
    const target = await screen.findByText(`${prefix}, Wort!`);
    const editor = spy.mock.instances.at(-1) as Editor;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        handleScrollToSelection: () => true,
      },
    });
    const start = editor.view.posAtDOM(target.firstChild!, 0);
    act(() =>
      editor.commands.insertContentAt(start, {
        type: 'documentField',
        attrs: { key: 'contract.name', label: 'Name' },
      })
    );
    const original = editor.getJSON();
    onChange.mockClear();
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode()!;
    while (text.textContent !== `${prefix}, Wort!`) text = walker.nextNode()!;
    const descriptor = Object.getOwnPropertyDescriptor(
      document,
      'caretPositionFromPoint'
    );
    Object.defineProperty(document, 'caretPositionFromPoint', {
      configurable: true,
      value: (x: number) => ({ offsetNode: text, offset: x - 10 }),
    });
    const key = (key: string, shiftKey = false) =>
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key,
          altKey: true,
          shiftKey,
          cancelable: true,
        });
        expect(
          editor.view.someProp('handleKeyDown', (handler) =>
            handler(editor.view, event)
          )
        ).toBe(true);
        expect(event.defaultPrevented).toBe(true);
      });
    try {
      for (const [anchor, head] of [
        [0, 3],
        [3, 0],
      ]) {
        act(() => {
          target.dispatchEvent(
            new MouseEvent('mousedown', {
              bubbles: true,
              cancelable: true,
              clientX: anchor + 10,
              clientY: 10,
              button: 0,
              buttons: 1,
              detail: 1,
            })
          );
          document.dispatchEvent(
            new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              clientX: head + 10,
              clientY: 10,
              buttons: 1,
            })
          );
          document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        });
        expect(editor.state.selection.anchor).toBe(start + 1 + anchor);
        expect(editor.state.selection.head).toBe(start + 1 + head);
        expect(window.getSelection()!.toString()).toBe(
          String(prefix).slice(0, 3)
        );
        const previous = editor.state.selection;
        act(() =>
          document.dispatchEvent(
            new MouseEvent('mousemove', {
              clientX: 11,
              clientY: 10,
              buttons: 1,
            })
          )
        );
        expect(editor.state.selection).toBe(previous);
      }
      act(() => editor.commands.setTextSelection(start + 1));
      key('ArrowRight', true);
      expect(
        editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        )
      ).toBe(prefix);
      key('ArrowLeft', true);
      expect(editor.state.selection.empty).toBe(true);
      key('ArrowLeft', true);
      expect(editor.state.selection.anchor).toBe(start + 1);
      expect(editor.state.selection.head).toBe(start);
      key('ArrowRight', true);
      expect(editor.state.selection.empty).toBe(true);
      key('ArrowLeft');
      expect(editor.state.selection.head).toBe(start);
      key('ArrowRight');
      expect(editor.state.selection.head).toBe(start + 1);
      key('ArrowRight');
      expect(editor.state.selection.head).toBe(
        start + 1 + String(prefix).length
      );
      key('ArrowRight', true);
      expect(
        editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        )
      ).toBe(', Wort');
      key('ArrowLeft');
      expect(editor.state.selection.head).toBe(
        start + 1 + String(prefix).length + 2
      );
      expect(editor.getJSON()).toEqual(original);
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      if (descriptor)
        Object.defineProperty(document, 'caretPositionFromPoint', descriptor);
      else Reflect.deleteProperty(document, 'caretPositionFromPoint');
      spy.mockRestore();
    }
  }
);

it.each(['paragraph', 'lineLabel'])(
  'moves across fields and between field-only %s rows',
  async (type) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    const value = fromSegments([]);
    const rows = ['beschreibung_1', 'beschreibung_2', 'beschreibung_3'].map(
      (label, index) => ({
        type,
        attrs: { top: index * 20 },
        content: [{ type: 'documentField', attrs: { key: label, label } }],
      })
    );
    value.content = {
      type: 'doc',
      content:
        type === 'lineLabel'
          ? [{ type: 'lineGroup', content: rows }, { type: 'paragraph' }]
          : [
              {
                type: 'orderedList',
                content: rows.map((row) => ({
                  type: 'listItem',
                  content: [row],
                })),
              },
              { type: 'paragraph' },
            ],
    };
    const onChange = vi.fn();
    render(
      <StyledDocumentEditor document={value} master onChange={onChange} />
    );
    await screen.findByText('beschreibung_3');
    const editor = spy.mock.instances.at(-1) as Editor;
    vi.spyOn(editor.view as typeof editor.view & { scrollToSelection: () => void }, 'scrollToSelection').mockImplementation(
      () => undefined
    );
    const starts: number[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isTextblock) starts.push(pos + 1);
    });
    vi.spyOn(editor.view, 'coordsAtPos').mockImplementation((pos) => {
      const row = starts.findIndex((start) => pos >= start && pos <= start + 1);
      const left = (pos - starts[row]) * 100;
      return { left, right: left, top: row * 20, bottom: row * 20 + 16 };
    });
    const press = (key: string, shiftKey = false) =>
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key,
          shiftKey,
          cancelable: true,
        });
        expect(
          editor.view.someProp('handleKeyDown', (handler) =>
            handler(editor.view, event)
          )
        ).toBe(true);
        expect(event.defaultPrevented).toBe(true);
      });
    const original = editor.getJSON();
    onChange.mockClear();
    act(() => editor.commands.setTextSelection(starts[2]));
    press('ArrowRight');
    expect(editor.state.selection.head).toBe(starts[2] + 1);
    press('ArrowLeft');
    expect(editor.state.selection.head).toBe(starts[2]);
    press('ArrowUp');
    expect(editor.state.selection.head).toBe(starts[1]);
    press('ArrowUp');
    expect(editor.state.selection.head).toBe(starts[0]);
    press('ArrowDown');
    expect(editor.state.selection.head).toBe(starts[1]);
    press('ArrowDown', true);
    expect(editor.state.selection.anchor).toBe(starts[1]);
    expect(editor.state.selection.head).toBe(starts[2]);
    press('ArrowLeft');
    expect(editor.state.selection.head).toBe(starts[1]);
    act(() => editor.commands.setTextSelection(starts[2]));
    press('ArrowLeft');
    expect(editor.state.selection.head).toBe(starts[1] + 1);
    press('ArrowRight');
    expect(editor.state.selection.head).toBe(starts[2]);
    expect(editor.getJSON()).toEqual(original);
    expect(onChange).not.toHaveBeenCalled();
    spy.mockRestore();
  }
);

it.each(['paragraph', 'lineLabel'])(
  'supports Command-arrow line/document motion and selection in %s',
  async (type) => {
    const spy = vi.spyOn(Editor.prototype, 'setOptions');
    const value = fromSegments([]);
    const row = {
      type,
      content: [
        {
          type: 'documentField',
          attrs: { key: 'contract.name', label: 'Name' },
        },
        { type: 'text', text: 'Alpha beta' },
      ],
    };
    value.content = {
      type: 'doc',
      content: [
        ...(type === 'lineLabel'
          ? [{ type: 'lineGroup', content: [row] }]
          : [row]),
        { type: 'paragraph', content: [{ type: 'text', text: 'Last row' }] },
      ],
    };
    const onChange = vi.fn();
    render(
      <StyledDocumentEditor document={value} master onChange={onChange} />
    );
    const target = await screen.findByText('Alpha beta');
    const editor = spy.mock.instances.at(-1) as Editor;
    vi.spyOn(editor.view as typeof editor.view & { scrollToSelection: () => void }, 'scrollToSelection').mockImplementation(
      () => undefined
    );
    const start = editor.view.posAtDOM(target, 0);
    const end = start + editor.state.doc.resolve(start).parent.content.size;
    // Simulate a wrapped row with a field on its first visual line.
    vi.spyOn(editor.view, 'coordsAtPos').mockImplementation((pos) => {
      const offset = pos - start;
      const top = offset < 5 ? 0 : 20;
      const left = (offset < 5 ? offset : offset - 5) * 10;
      return { top, bottom: top + 16, left, right: left };
    });
    const original = editor.getJSON();
    onChange.mockClear();
    const press = (key: string, shiftKey = false) =>
      act(() => {
        const event = new KeyboardEvent('keydown', {
          key,
          metaKey: true,
          shiftKey,
          cancelable: true,
        });
        expect(
          editor.view.someProp('handleKeyDown', (handler) =>
            handler(editor.view, event)
          )
        ).toBe(true);
        expect(event.defaultPrevented).toBe(true);
      });
    act(() => editor.commands.setTextSelection(start + 7));
    press('ArrowLeft');
    expect(editor.state.selection.head).toBe(start + 5);
    press('ArrowRight', true);
    expect(editor.state.selection.anchor).toBe(start + 5);
    expect(editor.state.selection.head).toBe(end);
    press('ArrowUp', true);
    expect(editor.state.selection.anchor).toBe(start + 5);
    expect(editor.state.selection.head).toBe(start);
    press('ArrowDown');
    expect(editor.state.selection.head).toBe(editor.state.doc.content.size - 1);
    expect(editor.state.selection.empty).toBe(true);
    act(() => editor.commands.setTextSelection(start + 2));
    press('ArrowLeft');
    expect(editor.state.selection.head).toBe(start);
    expect(editor.getJSON()).toEqual(original);
    expect(onChange).not.toHaveBeenCalled();
    spy.mockRestore();
  }
);
